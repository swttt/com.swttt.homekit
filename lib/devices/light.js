const Accessory = require('hap-nodejs').Accessory;
const Service = require('hap-nodejs').Service;
const Characteristic = require('hap-nodejs').Characteristic;
const uuid = require('hap-nodejs').uuid;
const debounce = require('lodash.debounce');

function map(inputStart, inputEnd, outputStart, outputEnd, input) {
  return outputStart + ((outputEnd - outputStart) / (inputEnd - inputStart)) * (input - inputStart);
}

module.exports = function(device, api) {

  let capabilities = Object.values(device.capabilities || {}).reduce((acc, val) => {
    acc[val.split('.')[0]] = true;
    return acc;
  }, {});

  // Init device
  var homekitAccessory = new Accessory(device.name, device.id);

  // Set device info
  homekitAccessory
    .getService(Service.AccessoryInformation)
    .setCharacteristic(Characteristic.Manufacturer, device.driverUri.owner_name)
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
      device.setCapabilityValue('onoff', value)
      callback();
    })
    .on('get', function(callback) {
      callback(null, device.capabilitiesObj['onoff'].value);
    });

  //Brightness
  if ('dim' in capabilities) {
    homekitAccessory
      .getService(Service.Lightbulb)
      .addCharacteristic(Characteristic.Brightness)
      .on('set', function(value, callback) {
        device.setCapabilityValue('dim', value / 100)
        callback();
      })
      .on('get', function(callback) {
        callback(null, device.capabilitiesObj['dim'].value * 100);
      });
  }

  //Saturation
  if ('light_saturation' in capabilities) {
    homekitAccessory
      .getService(Service.Lightbulb)
      .addCharacteristic(Characteristic.Saturation)
      .on('set', function(value, callback) {
        device.setCapabilityValue('light_saturation', value / 100)
        callback();
      })
      .on('get', function(callback) {
        callback(null, device.capabilitiesObj['light_saturation'].value * 100);
      });
  }

  //Temperature
  if ('light_temperature' in capabilities) {
    homekitAccessory
      .getService(Service.Lightbulb)
      .addCharacteristic(Characteristic.ColorTemperature)
      .on('set', function(value, callback) {

		// If device uses light_mode and was previously set on not temperature
	    // wait for color mode to be adjusted before setting light_temperature
		if ('light_mode' in capabilities && device.capabilitiesObj['light_mode'].value !== 'temperature') {
		  device.setCapabilityValue('light_mode', 'temperature');
	    }

		device.setCapabilityValue('light_temperature', map(140, 500, 0, 1, value))
        callback();
      })
      .on('get', function(callback) {
        callback(null, map(0, 1, 140, 500, device.capabilitiesObj['light_temperature'].value || 1) || 500);
      });
  }

  //Hue
  if ('light_hue' in capabilities) {
    homekitAccessory
      .getService(Service.Lightbulb)
      .addCharacteristic(Characteristic.Hue)
      .on('set', function(value, callback) {
        device.setCapabilityValue('light_hue', value / 360)
        callback();
      })
      .on('get', function(callback) {
        callback(null, device.capabilitiesObj['light_hue'].value * 360);
      });
  }

  // On realtime event update the device
  device.on('$update', id => {

    console.log('Realtime update from: ' + device.name)

    homekitAccessory
      .getService(Service.Lightbulb)
      .getCharacteristic(Characteristic.On)
      .updateValue(device.capabilitiesObj['onoff'].value);

    if ('dim' in capabilities) {
      homekitAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.Brightness)
        .updateValue(device.capabilitiesObj['dim'].value * 100);
    }
    if ('light_saturation' in capabilities) {
      homekitAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.Saturation)
        .updateValue(device.capabilitiesObj['light_saturation'].value * 100);
    }
	if ('light_temperature' in capabilities) {
      homekitAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.ColorTemperature)
        .updateValue(map(0, 1, 140, 500, device.capabilitiesObj['light_temperature'].value));
    }
    if ('light_hue' in capabilities) {
      homekitAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.Hue)
        .updateValue(device.capabilitiesObj['light_hue'].value * 360);
    }

  });

  // Return device to app.js
  return homekitAccessory
}
