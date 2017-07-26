"use strict";

const Homey = require('homey')
const {
  HomeyAPI
} = require('./lib/athom-api.js')
const Homekit = require('./lib/homekit.js')

// Make server and allDevices global
var server = {};
var allDevices = {};

// var uniqueid = 2;

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

    allDevices = await api.devices.getDevices();
    await api.devices.subscribe();

    // Get server object
    server = await Homekit.configServer(systeminfo);

    // Loop all devices
    for (var key in allDevices) {
      if (allDevices.hasOwnProperty(key)) {
        // If device has the class light
        if (allDevices[key].class == 'light') {
          // Add light object to server
          let light = await Homekit.createLight(allDevices[key]);
          await server.addAccessory(light);
          // Check for realtime events
          allDevices[key].on('$state', state => {
            console.log(state);
          });
        }
      }
    }
    console.log('\x1b[42m%s\x1b[0m', 'Added all devices..done here!');

    // Start the server
    server.startServer();

  }

  onInit() {
    // Start the server
    this.startServer()
      .then(console.log('\x1b[42m%s\x1b[0m', 'Homekit server starting!'))
      .catch(this.error);

    allDevices['eca9f089-f65a-4d43-9a8c-a30787ea01d4'].on('$state', (state) => {
      console.log('static one!')
      console.log(state);
    });

  }

}

module.exports = HomekitApp
