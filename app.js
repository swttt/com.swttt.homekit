"use strict";

// process.env.DEBUG = '*';

const Homey = require('homey')
const {
  HomeyAPI
} = require('athom-api')
const fs = require('fs');
const path = require('path');
const storage = require('node-persist');
const uuid = require('hap-nodejs').uuid;
const Bridge = require('hap-nodejs').Bridge;
const Service = require('hap-nodejs').Service;
const Characteristic = require('hap-nodejs').Characteristic;
const Accessory = require('hap-nodejs').Accessory;

// Device classes
const homekit = require('./lib/');

storage.initSync();
var allDevices
var bridge

class HomekitApp extends Homey.App {
  // Get API control function
  getApi() {
    if (!this.api) {
      this.api = HomeyAPI.forCurrentHomey();
    }
    return this.api;
  }

  // Get all devices function
  async getDevices() {
    const api = await this.getApi();
    allDevices = await api.devices.getDevices();
    return allDevices;
  }


  // Start server function
  async startingServer() {

    // Get the homey object
    const api = await this.getApi();
    // Subscribe to realtime events and set all devices global
    await api.devices.subscribe();
    api.devices.on('device.create', async (id) => {
      await console.log('New device found!')
      const device = await api.devices.getDevice({
        id: id
      })
      await this.addDevice(device);
    });
    allDevices = await api.devices.getDevices();

    // Start by creating our Bridge which will host all loaded Accessories
    bridge = new Bridge('Homey', uuid.generate("Homey"));
    bridge.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Manufacturer, 'Athom')
      .setCharacteristic(Characteristic.Model, 'Homey');

    // Listen for bridge identification event
    bridge.on('identify', function(paired, callback) {
      console.log("Homey identify");
      callback(); // success
    });

    // Loop devices
    for (let id in allDevices) {
      this.addDevice(allDevices[id], api);
    }

    // Publish bridge
    bridge.publish({
      username: "CC:22:3D:E3:CE:F6",
      port: 51826,
      pincode: "200-20-200",
      category: Accessory.Categories.BRIDGE
    });
    console.log("Started bridge");
  }

  // On app init
  onInit() {
    this.startingServer();
  }

  // Add device function
  addDevice(device, api) {
    let capabilities = Object.keys(device.capabilities || {}).reduce((acc, val) => {
      acc[val.split('.')[0]] = true;
      return acc;
    }, {});

    if (device.class === 'light' && 'onoff' in capabilities) {
      console.log('Found light: ' + device.name)
      bridge.addBridgedAccessory(homekit.createLight(device, api));
    }
    else if (device.class === 'lock') {
      console.log('Found lock: ' + device.name)
      bridge.addBridgedAccessory(homekit.createLock(device, api));
    }
    else if (device.class === 'windowcoverings' && 'windowcoverings_state' in capabilities && !('dim' in capabilities)) {
      console.log('Found blinds (state): ' + device.name)
      bridge.addBridgedAccessory(homekit.createStateBlinds(device, api));
    }
    else if (device.class === 'windowcoverings' && 'dim' in capabilities) {
      console.log('Found blinds (state): ' + device.name)
      bridge.addBridgedAccessory(homekit.createDimBlinds(device, api));
    }
    else if (device.class === 'socket' && 'onoff' in capabilities) {
      console.log('Found socket: ' + device.name)
      bridge.addBridgedAccessory(homekit.createSocket(device, api));
    }
    else if ((device.class === 'fan' || device.class === 'heater') && 'onoff' in capabilities) {
      console.log('Found fan/heater: ' + device.name)
      bridge.addBridgedAccessory(homekit.createFan(device, api));
    }
    else if (['amplifier', 'coffeemachine', 'kettle', 'tv', 'other'].includes(device.class) && 'onoff' in capabilities) {
      console.log('Found class with onoff: ' + device.name)
      bridge.addBridgedAccessory(homekit.createSwitch(device, api));
    }
    else if ('button' in capabilities) {
      console.log('Found button: ' + device.name)
      bridge.addBridgedAccessory(homekit.createButton(device, api));
    }
    else if (device.class === 'thermostat') {
      console.log('Found thermostat: ' + device.name)
      bridge.addBridgedAccessory(homekit.createThermostat(device, api));
    }
    else if (device.class === 'doorbell' && 'alarm_generic' in capabilities) {
      console.log('Found doorbell: ' + device.name)
      bridge.addBridgedAccessory(homekit.createDoorbell(device, api));
    }
    else if ('homealarm_state' in capabilities) {
      console.log('Found Security system: ' + device.name)
      bridge.addBridgedAccessory(homekit.createSecuritySystem(device, api));
    }
    else if ([ 'sensor', 'other' ].includes(device.class) && ('measure_luminance' in capabilities || 'measure_temperature' in capabilities || 'measure_humidity' in capabilities || 'alarm_motion' in capabilities || 'alarm_water' in capabilities || 'alarm_contact' in capabilities || 'alarm_smoke' in capabilities || 'alarm_co' in capabilities || 'alarm_co2' in capabilities)) {
      console.log('Found Sensor: ' + device.name)
      bridge.addBridgedAccessory(homekit.createSensor(device, api, capabilities));
    }
    else {
      console.log(`No matching class found for: ${ device.name } of class ${ device.class }, state =`, device.state);
    }

    device.on('$delete', id => {
      console.log('Found delete for: ' + device.id)
      bridge.removeBridgedAccessory(bridge.bridgedAccessories.find(r => r.UUID === device.id));
    });
  }


}

module.exports = HomekitApp
