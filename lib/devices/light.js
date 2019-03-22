const Accessory                 = require('hap-nodejs').Accessory;
const Service                   = require('hap-nodejs').Service;
const Characteristic            = require('hap-nodejs').Characteristic;
const uuid                      = require('hap-nodejs').uuid;
const debounce                  = require('lodash.debounce');
const { returnCapabilityValue } = require('./utils');

function map(inputStart, inputEnd, outputStart, outputEnd, input) {
  return outputStart + ((outputEnd - outputStart) / (inputEnd - inputStart)) * (input - inputStart);
}

module.exports = function(device, api, capabilities) {

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
    .on('get', returnCapabilityValue(device, 'onoff'));

  //Brightness
  if ('dim' in capabilities) {
    homekitAccessory
      .getService(Service.Lightbulb)
      .addCharacteristic(Characteristic.Brightness)
      .on('set', debounce(function(value, callback) {
        device.setCapabilityValue('dim', value / 100)
        callback();
      }, 500))
      .on('get', returnCapabilityValue(device, 'dim', v => v * 100));
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
      .on('get', returnCapabilityValue(device, 'light_saturation', v => v * 100));
  }

  //Temperature
  if ('light_temperature' in capabilities) {
    homekitAccessory
      .getService(Service.Lightbulb)
      .addCharacteristic(Characteristic.ColorTemperature)
      .on('set', function(value, callback) {

    // If device uses light_mode and was previously set on not temperature
    // wait for color mode to be adjusted before setting light_temperature
    if ('light_mode' in (device.capabilitiesObj || {}) && device.capabilitiesObj.light_mode.value !== 'temperature') {
      device.setCapabilityValue('light_mode', 'temperature');
    }

    device.setCapabilityValue('light_temperature', map(140, 500, 0, 1, value))
      callback();
    }).on('get', function(callback) {
      const value = 'light_temperature' in (device.capabilitiesObj || {}) ? device.capabilitiesObj.light_temperature.value : 1;
      callback(null, map(0, 1, 140, 500, value) || 500);
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
      .on('get', returnCapabilityValue(device, 'light_hue', v => v * 360));
  }

  // On realtime event update the device
  for (let i in device.capabilities) {
    if (['onoff','dim','light_saturation','light_temperature','light_hue'].includes(device.capabilities[i].split('.')[0])) {
      console.log('created listener for - ' + device.capabilities[i]);
      let listener = async (value) => {
        onStateChange(device.capabilities[i], value, device);
      };

      device.makeCapabilityInstance(device.capabilities[i], listener);
    }
  }

  async function onStateChange(capability, value, device) {
    console.log('State Change - ' + device.name + ' - ' + capability + ' - ' + value);
    const light = homekitAccessory.getService(Service.Lightbulb);

    if (capability === 'onoff') {
      light.getCharacteristic(Characteristic.On).updateValue(value);
    } else if (capability === 'dim') {
      light.getCharacteristic(Characteristic.Brightness).updateValue(value * 100);
    } else if (capability === 'light_saturation') {
      light.getCharacteristic(Characteristic.Saturation).updateValue(value * 100);
    } else if (capability === 'light_temperature') {
      light.getCharacteristic(Characteristic.ColorTemperature).updateValue(map(0, 1, 140, 500, value));
    } else if (capability === 'light_hue') {
      light.getCharacteristic(Characteristic.Hue).updateValue(value * 360);
    }
  }

  // Return device to app.js
  return homekitAccessory
}
