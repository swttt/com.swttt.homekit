'use strict'
const HAS = require('has-node');

// Unique id global
let uniqueid = 2;

function configServer(homey) {
    let server = {};

    // Config for server
    const config = new HAS.Config(homey.hostname, '71:E7:D6:42:BD:3C', HAS.categories.bridge, '../userdata/homey.json', 8090, '200-20-200');
    server = new HAS.Server(config);

    // Create bridge
    const bridge = new HAS.Accessory(1);

    // What happens when a user presses identify in the Home app (Idea: add speech output?)
    const identify = HAS.predefined.Identify(1, undefined, function(value, callback) {
        console.log('Bridge Identify', value);
        callback(HAS.statusCodes.OK);
      });

    // Set device information for the bridge
    const manufacturer = HAS.predefined.Manufacturer(2, 'Athom');
    const model = HAS.predefined.Model(3, 'V1');
    const name = HAS.predefined.Name(4, homey.hostname);
    const serialNumber = HAS.predefined.SerialNumber(5, homey.boot_id);
    const firmwareVersion = HAS.predefined.FirmwareRevision(6, homey.homey_version);

    // Add all services to the created bridge accesory
    bridge.addServices(HAS.predefined.AccessoryInformation(1, [identify, manufacturer, model, name, serialNumber, firmwareVersion]));

    // Add bridge to the server
    server.addAccessory(bridge);
    server.onIdentify = identify.onWrite;

    // Return server to app.js
    return server;
}

function createLight(device) {

  // New light
  const light = new HAS.Accessory(uniqueid);

  // What happens when a user presses identify in the Home app (Idea: add speech output or blinking light?)
  const lightIdentify = HAS.predefined.Identify(1, undefined, function(value, callback) {
    console.log(device.name)
    callback(HAS.statusCodes.OK);
  });
  // Set light details
  const lightManufacturer = HAS.predefined.Manufacturer(2, device.driver.owner_name);
  const lightModel = HAS.predefined.Model(3, device.driver.id);
  const lightName = HAS.predefined.Name(4, device.name);
  const lightSerialNumber = HAS.predefined.SerialNumber(5, device.id);
  const lightFirmwareVersion = HAS.predefined.FirmwareRevision(6, '1.0.0');

  // Add services to the light
  light.addServices(HAS.predefined.AccessoryInformation(1, [lightIdentify, lightManufacturer, lightModel, lightName, lightSerialNumber, lightFirmwareVersion]));


  // Create empty capabilities array
  var capabilities = [];
  // If device has onoff capability
  if ('onoff' in device.capabilities) {
    console.log('LIGHT: Found capability ONOFF');
    // Switch the capability on user input
    var on = HAS.predefined.On(8, device.state.onoff || false, (value, callback) => {
      // Calling the api
      device.setCapabilityValue("onoff", value)
      callback(HAS.statusCodes.OK);
    });
    // Push to array
    capabilities.push(on);
  }
  // If device has dim capability
  if ('dim' in device.capabilities && 'onoff' in device.capabilities) {
    console.log('LIGHT: Found capability DIM');
    // Switch the capability on user input
    var brightness = HAS.predefined.Brightness(9, device.state.dim || 1, (value, callback) => {
      // Calling the api
      device.setCapabilityValue("dim", value/100)
      callback(HAS.statusCodes.OK);
    });
    // Push to array
    capabilities.push(brightness);
  }

  // Connect to realtime events
  // Check for realtime events
  device.on('$state', state => {
    capabilities[0].setValue(state.onoff);
    capabilities[1].setValue(state.dim*100);
  });

  // add services to light
  light.addServices(HAS.predefined.Lightbulb(9, capabilities));

  // Add 1 to unique id
  uniqueid = uniqueid + 1;

  // Return light to app.js
  console.log(device.name + ' is added!');
  return light;


}

function createSocket(device) {
  console.log('SOCKET: Found capability ONOFF', device.name, device.state.onoff);

  // New light
  const newdevice = new HAS.Accessory(uniqueid);

  // What happens when a user presses identify in the Home app (Idea: add speech output or blinking light?)
  const lightIdentify = HAS.predefined.Identify(1, undefined, function(value, callback) {
    console.log(device.name)
    callback(HAS.statusCodes.OK);
  });
  // Set light details
  const lightManufacturer = HAS.predefined.Manufacturer(2, device.driver.owner_name);
  const lightModel = HAS.predefined.Model(3, device.driver.id);
  const lightName = HAS.predefined.Name(4, device.name);
  const lightSerialNumber = HAS.predefined.SerialNumber(5, device.id);
  const lightFirmwareVersion = HAS.predefined.FirmwareRevision(6, '1.0.0');

  // Add services to the light
  newdevice.addServices(HAS.predefined.AccessoryInformation(1, [lightIdentify, lightManufacturer, lightModel, lightName, lightSerialNumber, lightFirmwareVersion]));


  // Create empty capabilities array
  var capabilities = [];
  // If device has onoff capability
  if ('onoff' in device.capabilities) {
    // Switch the capability on user input
    var on = HAS.predefined.On(8, device.state.onoff || true, (value, callback) => {
      // Calling the api
      device.setCapabilityValue("onoff", value)
      callback(HAS.statusCodes.OK);
    });
    capabilities.push(on);

    var inuse = HAS.predefined.OutletInUse(7, true, (value, callback) => {
      // Calling the api
      console.log(device.name, value)
      callback(HAS.statusCodes.OK);
    });
    // Push to array
    capabilities.push(inuse);


  }
  // Connect to realtime events
  device.on('$state', state => {
    capabilities[0].setValue(state.onoff);
  });

  // add services to light
  newdevice.addServices(HAS.predefined.Outlet(9, capabilities));

  // Add 1 to unique id
  uniqueid = uniqueid + 1;

  // Return light to app.js
  console.log(device.name + ' is added!');
  return newdevice;


}


module.exports = {
  configServer: configServer,
  createLight: createLight,
  createSocket: createSocket
}
