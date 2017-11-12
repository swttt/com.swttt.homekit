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
const _ = require('lodash');

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
    api.devices.on('device.create', async(id) => {
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
    _.forEach(allDevices, (device) => {
      this.addDevice(device, api);
    });

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
    if (device.class === 'light' && 'onoff' in device.capabilities) {
      console.log('Found light: ' + device.name)
      bridge.addBridgedAccessory(homekit.createLight(device, api));
    }
    else if (device.class === 'lock') {
      console.log('Found lock: ' + device.name)
      bridge.addBridgedAccessory(homekit.createLock(device, api));
    }
    else if (device.class === 'windowcoverings' && 'windowcoverings_state' in device.capabilities && !('dim' in device.capabilities) ) {
      console.log('Found blinds (state): ' + device.name)
      bridge.addBridgedAccessory(homekit.createStateBlinds(device, api));
    }
    else if (device.class === 'windowcoverings' && 'dim' in device.capabilities) {
      console.log('Found blinds (state): ' + device.name)
      bridge.addBridgedAccessory(homekit.createDimBlinds(device, api));
    }
    else if (device.class === 'socket' && 'onoff' in device.capabilities) {
      console.log('Found socket: ' + device.name)
      bridge.addBridgedAccessory(homekit.createSocket(device, api));
    }
    else if (device.class === 'other' && 'onoff' in device.capabilities) {
      console.log('Found other with onoff: ' + device.name)
      bridge.addBridgedAccessory(homekit.createSwitch(device, api));
    }
    else if (device.class === 'sensor' && 'alarm_motion' in device.capabilities) {
      console.log('Found motion sensor: ' + device.name)
      bridge.addBridgedAccessory(homekit.createMotionSensor(device, api));
    }
    else if ('button' in device.capabilities) {
      console.log('Found button: ' + device.name)
      bridge.addBridgedAccessory(homekit.createButton(device, api));
    }
    else {
      console.log('No matching class found for: ' + device.name)
    }

    device.on('$delete', id => {
      console.log('Found delete for: ' + device.id)
      bridge.removeBridgedAccessory(_.find(bridge.bridgedAccessories, function(removedDev) {
        return removedDev.UUID === device.id;
      }));
    });
  }


}

module.exports = HomekitApp
