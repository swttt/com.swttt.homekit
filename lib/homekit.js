'use strict'
const HAS = require('has-node');


function configServer(homey) {
  let server = {};

  // Config for server
  const config = new HAS.Config(homey.hostname, '71:E7:D6:42:BD:3C', HAS.categories.bridge, '../userdata/homey.json', 8090, '200-20-200');
  server = new HAS.Server(config);

  // Create bridge
  const bridge = new HAS.Accessory(config.getHASID(homey.network.wlan0[0].mac));

  // What happens when a user presses identify in the Home app (Idea: add speech output?)
  const identify = HAS.predefined.Identify(1, undefined, function(value, callback) {
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

function createLight(device, id) {

  // New light
  const light = new HAS.Accessory(id);

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
    // Switch the capability on user input
    var brightness = HAS.predefined.Brightness(9, device.state.dim * 100 || 1, (value, callback) => {
      // Calling the api
      device.setCapabilityValue("dim", value / 100)
      callback(HAS.statusCodes.OK);
    });
    // Push to array
    capabilities.push(brightness);
  }

  // Connect to realtime events
  // Check for realtime events
  device.on('$state', state => {
    capabilities[0].setValue(state.onoff);
    if ('dim' in device.capabilities && 'onoff' in device.capabilities) {
      capabilities[1].setValue(state.dim * 100);
    }
  });

  // add services to light
  light.addServices(HAS.predefined.Lightbulb(9, capabilities));

  // Return light to app.js
  return light;


}

function createSocket(device, id) {
  // New light
  const newdevice = new HAS.Accessory(id);

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


  // Return light to app.js
  return newdevice;


}

function createSensor(device, id) {
  // New light
  const newdevice = new HAS.Accessory(id);
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
  if ('alarm_motion' in device.capabilities) {
    // Switch the capability on user input
    var motion = HAS.predefined.MotionDetected(8, device.state.alarm_motion || false);
    capabilities.push(motion);
    // Connect to realtime events
    device.on('$state', state => {
      motion.setValue(state.alarm_motion);
    });
  }
  if ('measure_luminance' in device.capabilities) {
    // Switch the capability on user input
    var lightsensor = HAS.predefined.CurrentAmbientLightLevel(9, device.state.measure_luminance || 0);
    // Connect to realtime events
    device.on('$state', state => {
      lightsensor.setValue(state.measure_luminance);
    });

    newdevice.addServices(HAS.predefined.LightSensor(14, [lightsensor]));
  }


  // add services to light
  newdevice.addServices(HAS.predefined.MotionSensor(9, capabilities));
  // Return light to app.js
  return newdevice;
}

function createLock(device, id) {
  // New light
  const newdevice = new HAS.Accessory(id);
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
  if ('locked' in device.capabilities) {
    // Switch the capability on user input


    var LockCurrentState = HAS.predefined.LockCurrentState(7, device.state.locked || 1);
    capabilities.push(LockCurrentState);

    var LockTargetState = HAS.predefined.LockTargetState(8, undefined, (value, callback) => {
      // Calling the api
      device.setCapabilityValue("locked", value)
      callback(HAS.statusCodes.OK);
    });
    capabilities.push(LockTargetState);




    // Connect to realtime events
    device.on('$state', state => {
      LockCurrentState.setValue(state.locked);
    });
  }
  // add services to light
  newdevice.addServices(HAS.predefined.LockMechanism(9, capabilities));
  // Return light to app.js
  return newdevice;
}

module.exports = {
  configServer: configServer,
  createLight: createLight,
  createSocket: createSocket,
  createSensor: createSensor,
  createLock: createLock
}
