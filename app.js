"use strict";
global.DEBUG = true;
const Homey = require('homey')
const {
  HomeyAPI
} = require('./lib/athom-api.js')
const Homekit = require('./lib/homekit.js')

// Make server and allDevices global
var server = {};
var allDevices = {};

class HomekitApp extends Homey.App {

  // Get homey object
  getApi() {
    if (!this.api) {
      this.api = HomeyAPI.forCurrentHomey(Homey.env.BEARER_TOKEN);
    }
    return this.api;
  }

  // Start server function
  async startServer() {
    // Get the homey object
    const api = await this.getApi();
    // Get system info
    const systeminfo = await api.system.getInfo();
    // Subscribe to realtime events and set all devices global
    await api.devices.subscribe();
    allDevices = await api.devices.getDevices();


    // Get server object
    server = await Homekit.configServer(systeminfo);

    // Loop all devices
    // for (var key in allDevices) {
    //   if (allDevices.hasOwnProperty(key)) {
    //     // If device has the class light
    //     if (allDevices[key].class == 'light') {
    //       // Add light object to server
    //       let light = await Homekit.createLight(allDevices[key]);
    //       await server.addAccessory(light);
    //       // Check for realtime events
    //       allDevices[key].on('$state', state => {
    //         console.log(state);
    //       });
    //     }
    //     // If device has the class socket
    //     else if (allDevices[key].class == 'socket') {
    //       // Add light object to server
    //       let socket = await Homekit.createSocket(allDevices[key]);
    //       await server.addAccessory(socket);
    //     }
    //   }
    // }
    console.log('\x1b[42m%s\x1b[0m', 'Added all devices..done here!');

    // Start the server
    server.startServer();

  }

  async onInit() {
    // Start the server
    await this.startServer()
      .then(console.log('\x1b[42m%s\x1b[0m', 'Homekit server starting!'))
      .catch(this.error);

  }

}

module.exports = HomekitApp
