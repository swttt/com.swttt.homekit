const fs                = require('fs');
const storage           = require('node-persist');
const path              = require('path');
const Homey             = require('homey')
const {
  uuid,
  Bridge,
  Service,
  Characteristic,
  Accessory }           = require('hap-nodejs');
const {
  ClassToService,
  CapabilityToCharacteristic,
  CapabilityToService,
  GetCapabilityValue }  = require('./lib/mappings');

// Load the correct version of the `athom-api` module.
const isFirmwareV2 = Homey.version && Homey.version.startsWith('2');
const { HomeyAPI } = require(isFirmwareV2 ? 'athom-api@v2' : 'athom-api@v1')

// Helper function: promisified timeouts.
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Throttle timer.
const isThrottled = (function() {
  let throttleTimer = 0;
  return (timeout = 500) => {
    const now = Date.now();
    if (now - throttleTimer < timeout) return true;
    throttleTimer = now;
    return false;
  };
})();

// Initialize persistent storage (used by `hap-nodejs`).
storage.initSync();

module.exports = class HomekitApp extends Homey.App {

  async onInit() {
    // Force-reset settings.
    if (Homey.env.RESET_SETTINGS) {
      Homey.ManagerSettings.set('exposedDevices', null);
      Homey.ManagerSettings.set('pairedDevices', null);
    }

    // Load list of devices that should be exposed through HomeKit
    this.exposedDevices = Homey.ManagerSettings.get('exposedDevices') ||
                          Homey.ManagerSettings.get('pairedDevices')  ||  // backward compatibility
                          {};

    // Retrieve Homey API reference.
    this.api = await HomeyAPI.forCurrentHomey();

    // Wait for devices to settle before starting the server.
    if (Homey.env.FAST_START !== 'true') {
      await this.settle();
    }

    // Start the HK bridge
    this.startBridge();
  }

  async settle() {
    this.log('waiting for devices to settle');
    let previousDeviceCount = 0;
    while (true) {
      let newDeviceCount = Object.keys(await this.getDevices()).length;
      if (newDeviceCount && newDeviceCount === previousDeviceCount) {
        this.log(`devices have settled (counted ${ newDeviceCount } in total)`);
        break;
      }
      previousDeviceCount = newDeviceCount;
      this.log('devices have not yet settled, waiting for 10 seconds...');
      await delay(10000);
    }
  }

  async getDevices() {
    return await this.api.devices.getDevices();
  }

  async startBridge() {
    this.log('starting bridge');

    // Start by creating our Bridge which will host all loaded Accessories
    const bridge = this.bridge = new Bridge('Homey Test', uuid.generate('Homey Test'));
    bridge
      .getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Manufacturer,     'Athom')
      .setCharacteristic(Characteristic.Model,            'Homey')
      .setCharacteristic(Characteristic.FirmwareRevision, isFirmwareV2 ? '2.0' : '1.5');

    // Listen for bridge identification event.
    bridge.on('identify', (paired, callback) => {
      this.log('Homey identify');
      callback();
    });

    // Retrieve a list of all devices and add them to the bridge.
    for (const device of Object.values( await this.getDevices() )) {
      if ('ready' in device && ! device.ready) continue;
      // Check if device should be exposed.
      if (this.shouldBeExposed(device.id)) {
        this.addDevice(device);
      }
    }

    // Watch for device creates to discover new devices.
    this.api.devices.on('device.create', async arg => {
      const id     = typeof arg === 'string' ? arg : arg.id;
      const device = isFirmwareV2 ? ( await this.waitForDevice(id) ) : ( await this.api.devices.getDevice({ id }) );

      if (device) {
        this.addDevice(device);
      }
    });

    // Publish bridge
    bridge.publish({
      username: 'CC:22:3D:E3:CE:F8',
      port:     51827,
      pincode:  '100-10-100',
      category: Accessory.Categories.BRIDGE
    });
    this.log('Started bridge');
  }

  async waitForDevice(id, attempts = 30, delay = 1000) {
    let device;
    while (--attempts) {
      device = await this.api.devices.getDevice({ id });
      if (device.ready) {
        return device;
      }
      await delay(1000);
    }
    this.log(`[${ device.name }] device failed to become ready after ${ attempts * (delay / 1000) } seconds.`);
    return null;
  }

  async addDevice(device) {
    const { api, bridge } = this;

    if (! device) {
      return;
    }

    const log = this.log.bind(this, `[${ device.name }]`);
    log('adding new device');

    // Create HomeKit accessory.
    const accessory = new Accessory(device.name, device.id);

    // Set device info
    accessory
      .getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Manufacturer, device.driver ? device.driver.owner_name : device.driverUri.replace(/^.*:/, ''))
      .setCharacteristic(Characteristic.Model, device.name + '(' + device.zone.name + ')')
      .setCharacteristic(Characteristic.SerialNumber, device.id)
      .on('identify', (paired, callback) => {
        log('identify');
        callback();
      });

    // Generate a list of unique capabilities for this device.
    const capabilitiesObj = Array.isArray(device.capabilities) ? device.capabilitiesObj : device.capabilities;
    let capabilities = Object.keys(capabilitiesObj).reduce((acc, val) => {
      acc[val.split('.')[0]] = true;
      return acc;
    }, {});

    // Map Homey device class to HomeKit service.
    const homekitService = ClassToService.lookup([ device.virtualClass, device.class ], capabilities);
    if (! homekitService) {
      return log(`couldn't map device class '${ device.class }' to HomeKit service`);
    }

    // Add service to accessory.
    try {
      var service = accessory.addService(homekitService, device.name);
    } catch(e) {
      log(`couldn't add service to accessory`);
      log(e);
      return;
    }

    // Add a Name characteristic.
    service.getCharacteristic(Characteristic.Name).on('get', cb => cb(null, device.name));

    // Map Homey capabilities to HomeKit characteristics.
    const mappedCapabilities = CapabilityToCharacteristic.lookup(capabilities);
    if (! mappedCapabilities.length) {
      return log(`couldn't map any of the device capabilities to HomeKit characteristics`);
    }

    // Add autodetected characteristics.
    const onStateChange = {};
    for (let [ capability, klass, { fromHomey = v => v, toHomey = v => v } = {} ] of mappedCapabilities) {
      const characteristic = service.getCharacteristic(klass) || service.addCharacteristic(klass);

      // Add event handlers.
      characteristic.on('get', cb => {
        try {
          return cb(null, fromHomey(GetCapabilityValue(device, capability)));
        } catch(e) {
          log(`failed to get value for '${ capability }'`);
          log(e);
          return cb(e);
        }
      }).on('set', (value, cb) => {
        if (isThrottled()) return cb();
        value = toHomey(value);
        device.setCapabilityValue(capability, value);
        log(`setting '${ capability }' to '${ value }'`);
        return cb();
      });

      // Register for capability changes (firmware v2)
      if (isFirmwareV2) {
        device.makeCapabilityInstance(capability, function onStateChange(value) {
          log(`value of '${ capability }' changed to ${ value }`);
          try {
            const newValue = fromHomey(GetCapabilityValue(device, capability));
            characteristic.updateValue(newValue);
            log(` - changed value of '${ characteristic.displayName }' to ${ newValue }`);
          } catch(e) {
            log(`failed to get value for '${ capability }'`);
            log(e);
          }
        });
      } else {
        // Or register an onStateChange handler (v1)
        if (! onStateChange[capability]) {
          onStateChange[capability] = [];
        }
        onStateChange[capability].push({ characteristic, fromHomey });
      }
    }

    // TODO: check if all required characteristics have been filled
    // this.log(`[${ device.name }] chars =`, service.characteristics.map(char => [ service.displayName, char.displayName, char.listenerCount('get') ]));

    // Register for update events (firmware v1 only).
    if (! isFirmwareV2) {
      device.on('$state', (state, capability) => {
        const value = state[capability];
        log(`value of '${ capability }' changed to ${ value }`);
        for (const { characteristic, fromHomey } of (onStateChange[capability] || [])) {
          log(` - updating ${ characteristic.displayName } to ${ fromHomey(value) }`);
          characteristic.updateValue(fromHomey(value));
        }
      });
    }

    // Register for device deletions.
    device.on('$delete', id => {
      this.deleteDevice(device);
    });

    // Add device to bridge.
    try {
      bridge.addBridgedAccessory(accessory);
      this.setExposed(device.id, true);
    } catch(e) {
      log(`couldn't add accessory to bridge`);
      log(e);
    }
  }

  async addDeviceById(id) {
    return this.addDevice(await this.findDeviceById(id));
  }

  deleteDevice(device) {
    const { api, bridge } = this;
    if (! device) {
      return;
    }
    this.log(`[${ device.name }] deleting device from HomeKit`);
    delete this.exposedDevices[device.id];
    Homey.ManagerSettings.set('exposedDevices', this.exposedDevices);
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

  shouldBeExposed(id) {
    return !( id in this.exposedDevices ) || this.exposedDevices[id];
  }

  setExposed(id, isExposed = true) {
    this.exposedDevices[id] = isExposed;
    Homey.ManagerSettings.set('exposedDevices', this.exposedDevices);
  }

  clearStorage() {
    storage.clearSync();
  }
};
