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
      this.api = HomeyAPI.forCurrentHomey(Homey.env.BEARER_TOKEN);
    }
    return this.api;
  }
  async getDevices() {
    const api = await this.getApi();

    return api.devices.getDevices();
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
      if (allPairedDevices[i] && allPairedDevices[i].class == 'light') {
        // Add light object to server
        let light = await Homekit.createLight(allDevices[allPairedDevices[i].id], server.config.getHASID(allPairedDevices[i].id));
        await server.addAccessory(light);
      }
      // If device has the class socket
      else if (allPairedDevices[i] && allPairedDevices[i].class == 'socket') {
        // Add light object to server
        let socket = await Homekit.createSocket(allDevices[allPairedDevices[i].id], server.config.getHASID(allPairedDevices[i].id));
        await server.addAccessory(socket);
      }
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
    // If device has the class light
    if (allDevices[device.id].class == 'light') {
      // Add light object to server
      let light = await Homekit.createLight(allDevices[device.id], server.config.getHASID(device.id));
      await server.addAccessory(light);
    }
    // If device has the class socket
    else if (allDevices[device.id].class == 'socket') {
      // Add light object to server
      let socket = await Homekit.createSocket(allDevices[device.id], server.config.getHASID(device.id));
      await server.addAccessory(socket);
    }
  }

  async deleteDevice(device){
    console.log(device.id);
    server.removeAccessory(server.config.getHASID(device.id));
  }

  getServerStatus() {
    return server.isRunning;
  }


}

module.exports = HomekitApp
