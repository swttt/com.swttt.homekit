"use strict";
const Homey = require('homey')
const {
  HomeyAPI
} = require('./lib/athom-api.js')
const Homekit = require('./lib/homekit.js')

let allDevices = {},
    server = {};


class HomekitApp extends Homey.App {
  // Get homey object
  getApi() {
    if (!this.api) {
      this.api = HomeyAPI.forCurrentHomey();
    }
    return this.api;
  }
  async getDevices() {
    const api = await this.getApi();
    allDevices = await api.devices.getDevices();
    return allDevices;
  }

  // Start server function
  async startingServer() {


    // Get the homey object
    const api = await this.getApi();
    // Get system info
    const systeminfo = await api.system.getInfo();
    // Subscribe to realtime events and set all devices global
    await api.devices.subscribe();
    allDevices = await api.devices.getDevices();

    server = await Homekit.configServer(systeminfo);
    // if(Homey.ManagerSettings.get('serverObject')){
    //   server.accessories = await Homey.ManagerSettings.get('serverObject');
    // }


    // Loop all devices
    const allPairedDevices = await Homey.ManagerSettings.get('pairedDevices') || [];
    var arrayLength = await allPairedDevices.length;

    // Get server object
    // if (!server) {
    //   await console.log('Empty server object found! Setting config now...')
    //   server = await Homekit.configServer(systeminfo);
    // }

    for (var i = 0; i < arrayLength; i++) {
      // If device has the class light
      await this.addDevice(allPairedDevices[i]);
    }
    console.log('\x1b[42m%s\x1b[0m', 'Added all devices..done here!');

    // Start the server
    server.startServer();

    // console.log(server);
    // Homey.ManagerSettings.set('serverObject', server.accessories);
    // Server status to true


  }

  async onInit() {
    // Start the server
    await this.startingServer()
      .then(console.log('\x1b[42m%s\x1b[0m', 'Homekit server starting!'))
      .catch(this.error);

  }

  async addDevice(device) {
    await this.getDevices();
    // If device has the class light
    if (allDevices[device.id].class == 'light') {
      // Add light object to server
      let light = await Homekit.createLight(allDevices[device.id], server.config.getHASID(device.id));
      await server.addAccessory(light);
      console.log(device.name + ' is added!');
    }
    // If device has the class socket
    if (allDevices[device.id].class == 'socket') {
      // Add socket object to server
      let socket = await Homekit.createSocket(allDevices[device.id], server.config.getHASID(device.id));
      await server.addAccessory(socket);
      console.log(device.name + ' is added!');
    }
    if (allDevices[device.id].class == 'sensor') {
      // Add sensor object to server
      let sensor = await Homekit.createSensor(allDevices[device.id], server.config.getHASID(device.id));
      await server.addAccessory(sensor);
      console.log(device.name + ' is added!');
    }
    if (allDevices[device.id].class == 'lock') {
      // Add lock object to server
      let lock = await Homekit.createLock(allDevices[device.id], server.config.getHASID(device.id));
      await server.addAccessory(lock);
      console.log(device.name + ' is added!');
    }
  }

  async deleteDevice(device){
    console.log(device.id);
    server.removeAccessory(server.config.getHASID(device.id));
    console.log(device.name + ' is removed!');
  }

  getServerStatus() {
    return server.isRunning;
  }


}

module.exports = HomekitApp
