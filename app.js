const fs                                                                        = require('fs');
const storage                                                                   = require('node-persist');
const path                                                                      = require('path');
const Homey                                                                     = require('homey')
const { uuid, Bridge, Service, Characteristic, Accessory }                      = require('hap-nodejs');
const { CLASS_TO_SERVICE, CAPABILITY_TO_CHARACTERISTIC, CAPABILITY_TO_SERVICE } = require('./lib/mappings');

// Load the correct version of the `athom-api` module.
const isFirmwareV2 = Homey.version && Homey.version.startsWith('2');
if (isFirmwareV2) {
  var { HomeyAPI }   = require('athom-api@v2')
} else {
  var { HomeyAPI }   = require('athom-api@v1')
}

// Helper function: promisified timeouts.
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Initialize persistent storage (used by `hap-nodejs`).
storage.initSync();

module.exports = class HomekitApp extends Homey.App {

  async onInit() {
    // Force-reset settings.
    if (Homey.env.RESET_SETTINGS) {
      Homey.ManagerSettings.set('pairedDevices', null);
    }

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
      .setCharacteristic(Characteristic.FirmwareRevision, '2.0');

    // Listen for bridge identification event.
    bridge.on('identify', (paired, callback) => {
      this.log('Homey identify');
      callback();
    });

    // Retrieve a list of all devices and add them to the bridge.
    for (const device of Object.values( await this.getDevices() )) {
      // TODO: check if device should be exposed.
      this.addDevice(device);
    }

    // Publish bridge
    bridge.publish({
      username: 'CC:22:3D:E3:CE:F8',
      port:     51827,
      pincode:  '100-10-100',
      category: Accessory.Categories.BRIDGE
    });
    this.log('Started bridge');
  }

  async addDevice(device) {
    const { api, bridge } = this;

    if (! device) {
      return;
    }

    // Map Homey capabilities to HomeKit characteristics.
    const capabilitiesObj = Array.isArray(device.capabilities) ? device.capabilitiesObj : device.capabilities;
    let capabilities = Object.keys(capabilitiesObj).reduce((acc, val) => {
      acc[val.split('.')[0]] = true;
      return acc;
   }, {});

    const homekitCharacteristics = Object.keys(capabilities).map(cap => CAPABILITY_TO_CHARACTERISTIC[cap]).filter(v => !!v);
    if (! homekitCharacteristics.length) {
      this.log(`[${ device.name }] couldn't map any of the device capabilities to HomeKit characteristics`);
      return;
    }

    // Create HomeKit accessory.
    const accessory = new Accessory(device.name, device.id);

    // Map Homey device class to HomeKit service.
    let homekitService = CLASS_TO_SERVICE[device.class];
    if (! homekitService) {
      this.log(`[${ device.name }] couldn't map device class '${ device.class }' to HomeKit service`);
      // Try to pick a reasonable device class based on device capabilities.
      for (const [ capability, service ] of Object.entries(CAPABILITY_TO_SERVICE)) {
        if (capability in capabilities) {
          this.log(`[${ device.name }] was able to pick a reasonable fallback based on the '${ capability }' capability`);
          homekitService = service;
          break;
        }
      }
      if (! homekitService) {
        this.log(`[${ device.name }] unable to pick a reasonable fallback`);
        return;
      }
    }

    // Add service.
    try {
      var service = accessory.addService(homekitService, device.name);
    } catch(e) {
      this.log(`[${ device.name }] couldn't add service to accessory`);
      this.log(e);
      return;
    }

    // Add a Name characteristic.
    service.getCharacteristic(Characteristic.Name).on('get', cb => cb(null, device.name));

    // Add autodetected characteristics.
    for (let characteristics of homekitCharacteristics) {
      if (! Array.isArray(characteristics)) {
        characteristics = [ characteristics ];
      }
      for (const obj of characteristics) {
        // Add a new characteristic if this service doesn't already have it.
        let characteristic = service.getCharacteristic(obj.class) || accessory.addCharacteristic(obj.class);
        let context        = { device, capabilities, log : this.log.bind(this) };
        if (obj.set) {
          characteristic.on('set', obj.set.bind(context));
        }
        if (obj.get) {
          characteristic.on('get', obj.get.bind(context));
        }
      }
    }

    // Set device info
    accessory
      .getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Manufacturer, device.driver ? device.driver.owner_name : device.driverUri.replace(/^.*:/, ''))
      .setCharacteristic(Characteristic.Model, device.name + '(' + device.zone.name + ')')
      .setCharacteristic(Characteristic.SerialNumber, device.id)
      .on('identify', (paired, callback) => {
        this.log(device.name + ' identify');
        callback();
      });

    // TODO: check if all required characteristics have been filled
    this.log(`[${ device.name }] chars =`, service.characteristics.map(char => [ service.displayName, char.displayName, char.listenerCount('get') ]));

    // TODO: realtime events.
    device.on('$delete', id => {
      this.deleteDevice(device);
    });

    // Add device to bridge.
    try {
      bridge.addBridgedAccessory(accessory);
    } catch(e) {
      this.log(`[${ device.name }] couldn't add accessory to bridge`);
      this.log(e);
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
};
