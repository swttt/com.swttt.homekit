// process.env.DEBUG = '*';

const Homey          = require('homey')
const { HomeyAPI }   = require('athom-api')
const fs             = require('fs');
const storage        = require('node-persist');
const path           = require('path');
const uuid           = require('hap-nodejs').uuid;
const Bridge         = require('hap-nodejs').Bridge;
const Service        = require('hap-nodejs').Service;
const Characteristic = require('hap-nodejs').Characteristic;
const Accessory      = require('hap-nodejs').Accessory;
const delay          = ms => new Promise(resolve => setTimeout(resolve, ms));

// Device classes
const homekit = require('./lib/');
let bridge;

storage.initSync();

class HomekitApp extends Homey.App {
  // Get API control function
  getApi() {
    if (! this.api) {
      this.api = HomeyAPI.forCurrentHomey();
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

    // Subscribe to realtime events and set all devices global
    await api.devices.subscribe();
    api.devices.on('device.create', async (id) => {
      this.log('New device found!')
      const device = await api.devices.getDevice({ id });
      this.addDevice(device);
      Homey.ManagerSettings.set('pairedDevices', this.pairedDevices);
    });

    // Start by creating our Bridge which will host all loaded Accessories
    bridge = new Bridge('Homey', uuid.generate("Homey"));
    bridge.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Manufacturer, 'Athom')
      .setCharacteristic(Characteristic.Model, 'Homey');

    // Listen for bridge identification event
    bridge.on('identify', function(paired, callback) {
      this.log("Homey identify");
      callback(); // success
    });

    // Retrieve a list of all devices, and a list of devices that should (not) be paired.
    let allDevices           = await this.getDevices();
    let pairedDevicesSetting = Homey.ManagerSettings.get('pairedDevices') || {};
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
    }

    // Update settings
    Homey.ManagerSettings.set('pairedDevices', this.pairedDevices);

    // Publish bridge
    bridge.publish({
      username: "CC:22:3D:E3:CE:F6",
      port: 51826,
      pincode: "200-20-200",
      category: Accessory.Categories.BRIDGE
    });
    this.log("Started bridge");
  }

  // On app init
  async onInit() {
    if (Homey.env.RESET_SETTINGS) {
      Homey.ManagerSettings.set('pairedDevices', null);
    }
    this.api = await this.getApi();

    // Wait for devices to settle before starting the server.
    if (Homey.env.FAST_START !== 'true') {
      this.log('waiting for devices to settle');
      let previousDeviceCount = 0;
      while (true) {
        let newDeviceCount = Object.keys(await this.getDevices()).length;
        if (newDeviceCount && newDeviceCount === previousDeviceCount) {
          this.log(`devices have settled (counted ${ newDeviceCount } in total)`);
          break;
        }
        previousDeviceCount = newDeviceCount;
        this.log(`devices have not yet settled, waiting for 30 seconds...`);
        await delay(30000);
      }
    }
    this.startingServer();
  }

  // Add device function
  async addDevice(device) {
    if (! device) return;

    let api          = this.api;
    let capabilities = Object.keys(device.capabilities || {}).reduce((acc, val) => {
      acc[val.split('.')[0]] = true;
      return acc;
    }, {});

    let isPaired = false;
    if (device.class === 'light' && 'onoff' in capabilities) {
      this.log('Found light: ' + device.name)
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createLight(device, api));
    }
    else if (device.class === 'lock') {
      this.log('Found lock: ' + device.name)
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createLock(device, api));
    }
    else if (device.class === 'windowcoverings' && 'windowcoverings_state' in capabilities && !('dim' in capabilities)) {
      this.log('Found blinds (state): ' + device.name)
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createStateBlinds(device, api));
    }
    else if (device.class === 'windowcoverings' && 'dim' in capabilities) {
      this.log('Found blinds (state): ' + device.name)
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createDimBlinds(device, api));
    }
    else if (device.class === 'socket' && 'onoff' in capabilities) {
      this.log('Found socket: ' + device.name)
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createSocket(device, api, capabilities));
    }
    else if ((device.class === 'fan' || device.class === 'heater') && 'onoff' in capabilities) {
      this.log('Found fan/heater: ' + device.name)
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createFan(device, api));
    }
    else if (['amplifier', 'coffeemachine', 'kettle', 'tv', 'other'].includes(device.class) && 'onoff' in capabilities) {
      this.log('Found class with onoff: ' + device.name)
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createSwitch(device, api));
    }
    else if ('button' in capabilities) {
      this.log('Found button: ' + device.name)
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createButton(device, api));
    }
    else if (device.class === 'thermostat') {
      this.log('Found thermostat: ' + device.name)
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createThermostat(device, api));
    }
    else if (device.class === 'doorbell' && 'alarm_generic' in capabilities) {
      this.log('Found doorbell: ' + device.name)
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createDoorbell(device, api));
    }
    else if ('homealarm_state' in capabilities) {
      this.log('Found Security system: ' + device.name)
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createSecuritySystem(device, api));
    }
    else if ([ 'sensor', 'other' ].includes(device.class) && ('measure_luminance' in capabilities || 'measure_temperature' in capabilities || 'measure_humidity' in capabilities || 'measure_pressure' in capabilities || 'alarm_motion' in capabilities || 'alarm_water' in capabilities || 'alarm_contact' in capabilities || 'alarm_smoke' in capabilities || 'alarm_co' in capabilities || 'alarm_co2' in capabilities)) {
      this.log('Found Sensor: ' + device.name)
      isPaired = true;
      bridge.addBridgedAccessory(homekit.createSensor(device, api, capabilities));
    }
    else {
      this.log(`No matching class found for: ${ device.name } of class ${ device.class }, state =`, device.state);
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
    if (! device) return;
    this.log(`Deleting device '${ device.name }' (${ device.id }) from HomeKit`);
    delete this.pairedDevices[device.id];
    Homey.ManagerSettings.set('pairedDevices', this.pairedDevices);
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
    storage.clearSync();
  }
}

module.exports = HomekitApp;
