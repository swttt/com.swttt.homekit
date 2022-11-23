const Homey           = require('homey')
const { HomeyAPIApp } = require('./modules/homey-api');
const fs              = require('fs');
const storage         = require('node-persist');
const path            = require('path');
const debounce        = require('lodash.debounce');
const {
  HAPStorage,
  uuid,
  Bridge,
  Service,
  Characteristic,
  Accessory
}           = require('./modules/hap-nodejs');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Device classes
const homekit = require('./lib/');
let bridge;

// Clear storage the hard way.
function clearHAPStorage() {
  console.error('Clearing internal storage:');
  for (const f of fs.readdirSync('/userdata')) {
    const path = `/userdata/${ f }`;
    console.error('- removing', path);
    fs.rmSync(path, { recursive : true });
  }
}

// Try to initialize existing storage.
try {
  HAPStorage.setCustomStoragePath('/userdata');
  HAPStorage.storage();
} catch(e) {
  console.error('Error initializing existing storage', e);
  clearHAPStorage();
  throw Error('Please restart do to an internal storage issue');
}

module.exports = class HomekitApp extends Homey.App {
  // Get API control function
  async getApi() {
    if (! this.api) {
      this.api = new HomeyAPIApp({ homey: this.homey });
      // have to do this really early to work around a bug in the Web API
      await this.api.devices.connect();
    }
    return this.api;
  }

  // Get all devices function
  async getDevices() {
    return await this.api.devices.getDevices();
  }

  // Start server function
  async startingServer() {
    this.log('starting server');
    const api = this.api;

    // Start by creating our Bridge which will host all loaded Accessories
    let bridgeIdentifier = this.homey.settings.get('bridgeIdentifier') || 'Homey';
    this.log(`Using "${ bridgeIdentifier }" as bridge identifier`);
    bridge = new Bridge(bridgeIdentifier, uuid.generate(bridgeIdentifier));
    bridge
      .getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Manufacturer, 'Athom')
      .setCharacteristic(Characteristic.Model, 'Homey')
      .setCharacteristic(Characteristic.FirmwareRevision, '2.0');

    // Listen for bridge identification event
    bridge.on('identify', function(paired, callback) {
      console.log('Homey identify');
      callback(); // success
    });

    // Retrieve a list of all devices, and a list of devices that should (not) be paired.
    let knownDevices         = {};
    let allDevices           = await this.getDevices();
    let pairedDevicesSetting = this.homey.settings.get('pairedDevices') || {};
    this.pairedDevices       = {};
    for (let id in allDevices) {
      let device = allDevices[id];

      // Assume that unknown (new) devices should be paired.
      if (! (device.id in pairedDevicesSetting)) {
        pairedDevicesSetting[device.id] = true;
      }

      if (pairedDevicesSetting[id] === true) {
        this.addDevice(device);
      } else {
        this.pairedDevices[device.id] = false;
        this.log(`Not adding '${ device.name }' (shouldn't be paired)`);
      }
      knownDevices[id] = true;
    }

    // Update settings
    this.homey.settings.set('pairedDevices', this.pairedDevices);

    // Watch for setting changes
    this.homey.settings.on('set', debounce(key => {
      if (key === 'pairedDevices') {
        this.pairedDevices = this.homey.settings.get('pairedDevices') || {};
      }
    }, 100));

    // Subscribe to realtime events and set all devices global
    api.devices.on('device.update', async ({ id, ready }) => {
      if (! ready) return;
      if (id in knownDevices) return;
      knownDevices[id] = true;
      this.log('New device found!');
      const device =  await api.devices.getDevice({ id });
      this.addDevice(device);
      this.homey.settings.set('pairedDevices', this.pairedDevices);
    });

    // Publish bridge
    const username = this.homey.settings.get('username') || 'CC:22:3D:E3:CE:F6';
    this.log(`Using ${ username } as username.`);
    try {
      await bridge.publish({
        username: username,
        port:     51833,
        pincode:  '200-20-200',
        category: Accessory.Categories.BRIDGE
      });
      this.log('Started bridge');
    } catch(e) {
      this.error('Unable to start bridge');
      this.error(e);
    }
  }

  // On app init
  async onInit() {
    if (Homey.env.RESET_SETTINGS) {
      this.homey.settings.set('pairedDevices', null);
    }
    try {
      this.api = await this.getApi();
    } catch(e) {
      this.error('Unable to get API instance');
      this.error(e);
      return;
    }
    this.pairedDevices = {};

    // If the app is started less than 10 minuten after a reboot, wait for
    // devices to settle before starting the bridge, otherwise iOS will get
    // confused.
    const settleTime = this.homey.settings.get('settleTime') || 120;
    const uptime     = (await this.api.system.getInfo()).uptime;
    if (uptime < 600) {
      this.log('Homey rebooted, waiting for devices to settle');
      let previousDeviceCount = 0;
      while (true) {
        let newDeviceCount = Object.keys(await this.getDevices()).length;
        if (newDeviceCount && newDeviceCount === previousDeviceCount) {
          this.log(`devices have settled (counted ${ newDeviceCount } in total)`);
          break;
        }
        previousDeviceCount = newDeviceCount;
        this.log(`devices have not yet settled, waiting for ${ settleTime } seconds...`);
        await delay(settleTime * 1000);
      }
    }
    this.startingServer();
  }

  // Add device function
  async addDevice(device) {
    if (! device || ! device.ready || ! device.capabilitiesObj || bridge.bridgedAccessories.length >= 149) return;

    let api          = this.api;
    let capabilities = device.capabilities.reduce((acc, val) => {
      if (typeof val === 'string') {
        acc[val.split('.')[0]] = true;
      }
      return acc;
    }, {});

    let isPaired = false;
    if ([device.class, device.virtualClass].includes('light') && 'onoff' in capabilities) {
      this.log('Found light: ' + device.name)
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createLight(device, api));
    } else if (device.class === 'lock' && 'locked' in capabilities) {
      this.log('Found lock: ' + device.name)
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createLock(device, api));
    } else if ([ 'curtain', 'blinds', 'sunshade', 'windowcoverings' ].includes(device.class) && 'windowcoverings_set' in capabilities && !('dim' in capabilities)) {
      this.log(`Found ${ device.class } (windowcovering_set): ${ device.name }`);
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createCurtains(device, api));
    } else if ([ 'curtain', 'blinds', 'sunshade', 'windowcoverings' ].includes(device.class) && 'windowcoverings_state' in capabilities && !('dim' in capabilities)) {
      this.log('Found blinds (state): ' + device.name)
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createStateBlinds(device, api));
    } else if (device.class === 'windowcoverings' && 'dim' in capabilities) {
      this.log('Found blinds (dim): ' + device.name)
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createDimBlinds(device, api));
    } else if (device.class === 'socket' && 'onoff' in capabilities) {
      this.log('Found socket: ' + device.name)
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createSocket(device, api, capabilities));
    } else if ((device.class === 'fan' || device.class === 'heater') && 'onoff' in capabilities) {
      this.log('Found fan/heater: ' + device.name)
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createFan(device, api, capabilities));
    } else if (['amplifier', 'button', 'coffeemachine', 'kettle', 'tv', 'other', 'remote'].includes(device.class) && 'onoff' in capabilities) {
      this.log('Found class with onoff: ' + device.name)
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createSwitch(device, api));
    } else if (device.class === 'thermostat' && 'measure_temperature' in capabilities && 'target_temperature' in capabilities) {
      this.log('Found thermostat: ' + device.name)
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createThermostat(device, api, capabilities));
    } else if (device.class === 'doorbell' && 'alarm_generic' in capabilities) {
      this.log('Found doorbell: ' + device.name)
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createDoorbell(device, api));
    } else if ('homealarm_state' in capabilities || device.class === 'homealarm' || device.virtualClass === 'homealarm') {
      this.log('Found Security system: ' + device.name)
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createSecuritySystem(device, api, capabilities));
    } else if ([ device.class, device.virtualClass ].includes('speaker')) {
      this.log('Found speaker: ' + device.name)
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createSpeaker(device, api, capabilities));
    } else if ('button' in capabilities) {
      this.log('Found button: ' + device.name)
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createButton(device, api));
    } else if ([ 'sensor', 'other' ].includes(device.class) && ('measure_luminance' in capabilities || 'measure_temperature' in capabilities || 'measure_humidity' in capabilities || 'measure_pressure' in capabilities || 'alarm_motion' in capabilities || 'alarm_water' in capabilities || 'alarm_contact' in capabilities || 'alarm_smoke' in capabilities || 'alarm_co' in capabilities || 'alarm_co2' in capabilities)) {
      this.log('Found Sensor: ' + device.name)
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createSensor(device, api, capabilities));
    } else if (device.class === 'garagedoor' && 'garagedoor_closed' in capabilities) {
      this.log('Found garage door:', device.name);
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createGarageDoorOpener(device, api, capabilities));
    } else {
      this.log(`No matching class found for: ${ device.name } of class ${ device.class }`);
    }
    this.pairedDevices[device.id] = isPaired;

    device.on('$delete', id => {
      this.deleteDevice(device);
    });
  }

  async addDeviceById(id) {
    return this.addDevice(await this.findDeviceById(id));
  }

  deleteDevice(device) {
    if (! device || ! bridge) return;
    this.log(`Deleting device '${ device.name }' (${ device.id }) from HomeKit`);
    delete this.pairedDevices[device.id];
    this.homey.settings.set('pairedDevices', this.pairedDevices);
    let acc = bridge.bridgedAccessories.find(r => r.UUID === device.id);
    acc && bridge.removeBridgedAccessory(acc);
  }

  async deleteDeviceById(id) {
    return this.deleteDevice(await this.findDeviceById(id));
  }

  async findDeviceById(id) {
    let allDevices = await this.getDevices();
    return Object.values(allDevices).find(device => device.id === id);
  }

  clearStorage() {
    clearHAPStorage();
    // generate a new bridge 'username' to allow iOS to rediscover the bridge
    const username = 'XX:XX:XX:XX:XX:XX'.replace(/X/g, function() {
      return '0123456789ABCDEF'.charAt(Math.floor(Math.random() * 16))
    });
    this.log(`Setting new username to ${ username }`);
    this.homey.settings.set('username', username);
    this.homey.settings.set('pairedDevices', null);
  }
}
