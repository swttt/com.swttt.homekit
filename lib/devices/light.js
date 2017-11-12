const Accessory = require('hap-nodejs').Accessory;
const Service = require('hap-nodejs').Service;
const Characteristic = require('hap-nodejs').Characteristic;
const uuid = require('hap-nodejs').uuid;
const _ = require('lodash');

function map(inputStart, inputEnd, outputStart, outputEnd, input) {
  return outputStart + ((outputEnd - outputStart) / (inputEnd - inputStart)) * (input - inputStart);
}

module.exports = function(device, api) {

  // Init device
  var homekitAccessory = new Accessory(device.name, device.id);

  // Set device info
  homekitAccessory
    .getService(Service.AccessoryInformation)
    .setCharacteristic(Characteristic.Manufacturer, device.driver.owner_name)
    .setCharacteristic(Characteristic.Model, device.name + '(' + device.zone.name + ')')
    .setCharacteristic(Characteristic.SerialNumber, device.id);

  // Device identify when added
  homekitAccessory.on('identify', function(paired, callback) {
    console.log(device.name + ' identify');
    callback();
  });

  // Add services and charesteristics
  // Onoff
  homekitAccessory
    .addService(Service.Lightbulb, device.name)
    .getCharacteristic(Characteristic.On)
    .on('set', function(value, callback) {
      device.setCapabilityValue("onoff", value)
      callback();
    })
    .on('get', function(callback) {
      callback(null, device.state.onoff);
    });

  //Brightness
  if (device.capabilities.dim) {
    homekitAccessory
      .getService(Service.Lightbulb)
      .addCharacteristic(Characteristic.Brightness)
      .on('set', function(value, callback) {
        device.setCapabilityValue("dim", value / 100)
        callback();
      })
      .on('get', function(callback) {
        callback(null, device.state.dim * 100);
      });
  }

  //Saturation
  if (device.capabilities.light_saturation) {
    homekitAccessory
      .getService(Service.Lightbulb)
      .addCharacteristic(Characteristic.Saturation)
      .on('set', function(value, callback) {
        device.setCapabilityValue("light_saturation", value / 100)
        callback();
      })
      .on('get', function(callback) {
        callback(null, device.state.light_saturation * 100);
      });
  }

  //Temperature
  if (device.capabilities.light_temperature) {
    homekitAccessory
      .getService(Service.Lightbulb)
      .addCharacteristic(Characteristic.ColorTemperature)
      .on('set', function(value, callback) {
		
		// If device uses light_mode and was previously set on not temperature
	    // wait for color mode to be adjusted before setting light_temperature
		if ('light_mode' in device.capabilities && device.state.light_mode !== 'temperature') {
		  device.setCapabilityValue("light_mode", "temperature");
	    }
		
		device.setCapabilityValue("light_temperature", map(140, 500, 0, 1, value))
        callback();
      })
      .on('get', function(callback) {
        callback(null, map(0, 1, 140, 500, device.state.light_temperature || 1) || 500);
      });
  }

  //Hue
  if (device.capabilities.light_hue) {
    homekitAccessory
      .getService(Service.Lightbulb)
      .addCharacteristic(Characteristic.Hue)
      .on('set', function(value, callback) {
        device.setCapabilityValue("light_hue", value / 100)
        callback();
      })
      .on('get', function(callback) {
        callback(null, device.state.light_hue * 100);
      });
  }

  // On realtime event update the device
  device.on('$state', _.debounce(state => {

    console.log('Realtime update from: ' + device.name)

    homekitAccessory
      .getService(Service.Lightbulb)
      .getCharacteristic(Characteristic.On)
      .updateValue(state.onoff);

    if (state.dim) {
      homekitAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.Brightness)
        .updateValue(state.dim * 100);
    }
    if (state.light_saturation) {
      homekitAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.Saturation)
        .updateValue(state.light_saturation * 100);
    }
	if (state.light_temperature) {
      homekitAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.ColorTemperature)
        .updateValue(map(0, 1, 140, 500, state.light_temperature));
    }
    if (state.light_hue) {
      homekitAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.Hue)
        .updateValue(state.light_hue * 100);
    }

  }));

  // Return device to app.js
  return homekitAccessory
}
