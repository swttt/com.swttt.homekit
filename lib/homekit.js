'use strict'
const HAS = require('has-node');


function configServer(homey) {
  let server = {};

  // Config for server
  const config = new HAS.Config(homey.hostname, homey.wifi_mac, HAS.categories.bridge, '../userdata/homey.json', 8090, '200-20-200');
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
  const name = HAS.predefined.Name(4, 'Homey');
  const serialNumber = HAS.predefined.SerialNumber(5, '1337-1337-1337');
  const firmwareVersion = HAS.predefined.FirmwareRevision(6, '1.3.3.7');

  // Add all services to the created bridge accesory
  bridge.addServices(HAS.predefined.AccessoryInformation(1, [identify, manufacturer, model, name, serialNumber, firmwareVersion]));

  // Add bridge to the server
  server.addAccessory(bridge);
  server.onIdentify = identify.onWrite;
  console.log('Server config done.', 'success');
  // Return server to app.js
  return server;
}

function createLight(device, id) {

  // New light
  const light = new HAS.Accessory(id);

  // What happens when a user presses identify in the Home app (Idea: add speech output or blinking light?)
  const lightIdentify = HAS.predefined.Identify(1, undefined, function(value, callback) {

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
      console.log('Switching onoff for: ' + device.name + '. Value: ' +  value, "info");
      device.setCapabilityValue("onoff", value)
      callback(HAS.statusCodes.OK);
    });
    // Check for realtime events
    device.on('$state', state => {
      console.log('Realtime event from: ' + device.name + '. Value: ' +  JSON.stringify(state), "info")
      on.setValue(state.onoff || false);
    });
    // Push to array
    capabilities.push(on);
  }
  // If device has dim capability
  if ('dim' in device.capabilities && 'onoff' in device.capabilities) {
    // Switch the capability on user input
    var brightness = HAS.predefined.Brightness(9, device.state.dim * 100 || 1, (value, callback) => {
      // Calling the api
      console.log('Switching dim for: ' + device.name + '. Value: ' +  value/100, "info");
      device.setCapabilityValue("dim", value / 100)
      callback(HAS.statusCodes.OK);
    });
    // Check for realtime events
    device.on('$state', state => {
      brightness.setValue(state.dim * 100 || 100);
    });
    // Push to array
    capabilities.push(brightness);
  }
  // If device has hue capability
  if ('light_hue' in device.capabilities) {
    console.log('Found light_hue!', 'info');
    // Switch the capability on user input
    var hue = HAS.predefined.Hue(10, device.state.light_hue * 360 || 360, async (value, callback) => {
      // Calling the api
      // console.log("Hue: " + value / 360)
      console.log('Switching light_hue for: ' + device.name + '. Value: ' +  value/360, "info");

      // If device uses light_mode and was previously set on not color
      // wait for color mode to be adjusted before setting hue
	  if ('light_mode' in device.capabilities && device.state.light_mode !== 'color') {
	    await device.setCapabilityValue("light_mode", "color");
	  }
      device.setCapabilityValue("light_hue", value / 360)
      callback(HAS.statusCodes.OK);
    });

    // Check for realtime events
    device.on('$state', state => {
      hue.setValue(state.light_hue * 360 || 360);
    });
    // Push to array
    capabilities.push(hue);

    // Hack to enable RGB control in Homekit for devices with only light_hue capability
    if (!('light_saturation' in device.capabilities)) {
        // If device has sat capability
        console.log('Found light_saturation!', 'info', device.capabilities);
        // Switch the capability on user input
        var sat = HAS.predefined.Saturation(11, device.state.light_saturation * 100 || 100, async (value, callback) => {

            // If device uses light_mode and was previously set on not color
            // wait for color mode to be adjusted before setting hue
            if ('light_mode' in device.capabilities && device.state.light_mode !== 'color') {
                await device.setCapabilityValue("light_mode", "color");
            }
            callback(HAS.statusCodes.OK);
        });

        // Push to array
        capabilities.push(sat);
    }
  }

  // If device has sat capability
  if ('light_saturation' in device.capabilities) {
    console.log('Found light_saturation!', 'info');
    // Switch the capability on user input
    var sat = HAS.predefined.Saturation(11, device.state.light_saturation * 100 || 100, async (value, callback) => {
      // Calling the api
      // console.log("Saturation: " + value / 100)
      console.log('Switching light_saturation for: ' + device.name + '. Value: ' +  value/100, "info");

      // If device uses light_mode and was previously set on not color
	  // wait for color mode to be adjusted before setting hue
      if ('light_mode' in device.capabilities && device.state.light_mode !== 'color') {
	    await device.setCapabilityValue("light_mode", "color");
	  }
	  device.setCapabilityValue("light_saturation", value / 100)
      callback(HAS.statusCodes.OK);
    });

    // Check for realtime events
    device.on('$state', state => {
        sat.setValue(state.light_saturation * 100 || 100);
    });
    // Push to array
    capabilities.push(sat);
  }

  function map(inputStart, inputEnd, outputStart, outputEnd, input) {
    return outputStart + ((outputEnd - outputStart) / (inputEnd - inputStart)) * (input - inputStart);
  }

  if ('light_temperature' in device.capabilities) {
    console.log('Found light_temp!', 'info');
    // Switch the capability on user input
      // Not sure about first param '12', but seems to work
    var temp = HAS.predefined.ColorTemperature(12, map(0, 1, 140, 500, device.state.light_temperature || 1) || 500, async (value, callback) => {
      // Calling the api
      // console.log("Saturation: " + value / 100)
      console.log('Switching light_temperature for: ' + device.name + '. Value: ' +   map(140, 500, 0, 1, value), "info");

	  // If device uses light_mode and was previously set on not temperature
	  // wait for color mode to be adjusted before setting light_temperature
      if ('light_mode' in device.capabilities && device.state.light_mode !== 'temperature') {
	    await device.setCapabilityValue("light_mode", "temperature");
	  }
      device.setCapabilityValue("light_temperature", map(140, 500, 0, 1, value));
      callback(HAS.statusCodes.OK);
    });

    // Check for realtime events
    device.on('$state', state => {
      if (device.state.light_mode === 'temperature') {
	    sat.setValue(0);
	    hue.setValue(0);
	    temp.setValue(map(0, 1, 140, 500, device.state.light_temperature) || 500);
      }
    });
    // Push to array
    capabilities.push(temp);
  }



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
      console.log('Switching onoff for: ' + device.name + '. Value: ' +  value, "info");
      device.setCapabilityValue("onoff", value)
      callback(HAS.statusCodes.OK);
    });
    capabilities.push(on);

    var inuse = HAS.predefined.OutletInUse(7, true, (value, callback) => {
      // Calling the api

      callback(HAS.statusCodes.OK);
    });
    // Push to array
    capabilities.push(inuse);


  }
  // Connect to realtime events
  device.on('$state', state => {
    console.log('Realtime event from: ' + device.name + '. Value: ' +  JSON.stringify(state), "info")
    on.setValue(state.onoff || false);
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
      console.log('Realtime event from: ' + device.name + '. Value: ' +  JSON.stringify(state), "info")
      motion.setValue(state.alarm_motion || false);
    });
  }
  if ('measure_luminance' in device.capabilities) {
    // Switch the capability on user input
    var lightsensor = HAS.predefined.CurrentAmbientLightLevel(9, device.state.measure_luminance || 0.1);
    // Connect to realtime events
    device.on('$state', state => {
      lightsensor.setValue(state.measure_luminance || 0.1);
    });

    newdevice.addServices(HAS.predefined.LightSensor(14, [lightsensor]));
  }
  if ('measure_temperature' in device.capabilities) {
    // Switch the capability on user input
    var temperature = HAS.predefined.CurrentTemperature(10, device.state.measure_temperature || 0);
    // Connect to realtime events
    device.on('$state', state => {
      temperature.setValue(state.measure_temperature || 0);
    });

    newdevice.addServices(HAS.predefined.TemperatureSensor(15, [temperature]));
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

    function lockState(state) {

      if (state) {
        return 1;
      }
      else {
        return 0;
      }

    }

    var LockCurrentState = HAS.predefined.LockCurrentState(7, lockState(device.state.locked));
    capabilities.push(LockCurrentState);

    var LockTargetState = HAS.predefined.LockTargetState(8, lockState(device.state.locked), (value, callback) => {
      // Calling the api
      // device.setCapabilityValue("locked")
      if (value == 1) {
        console.log('Switching locked for: ' + device.name + '. Value: ' +  true, "info");
        device.setCapabilityValue("locked", true)
      }
      else if (value == 0) {
        console.log('Switching locked for: ' + device.name + '. Value: ' +  false, "info");
        device.setCapabilityValue("locked", false)
      }
      callback(HAS.statusCodes.OK);
    });
    capabilities.push(LockTargetState);

    // Connect to realtime events
    device.on('$state', state => {
      console.log('Realtime event from: ' + device.name + '. Value: ' +  JSON.stringify(state), "info")
      LockCurrentState.setValue(lockState(state.locked) || 1);

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
