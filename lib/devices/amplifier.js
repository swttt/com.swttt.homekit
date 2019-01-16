const Accessory = require('hap-nodejs').Accessory;
const Service = require('hap-nodejs').Service;
const Characteristic = require('hap-nodejs').Characteristic;
const uuid = require('hap-nodejs').uuid;
const debounce = require('lodash.debounce');

function map(inputStart, inputEnd, outputStart, outputEnd, input) {
  return outputStart + ((outputEnd - outputStart) / (inputEnd - inputStart)) * (input - inputStart);
}

module.exports = function(device, api) {

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
      callback(null, device.capabilitiesObj.onoff.value);
    });

  // Volume
  homekitAccessory
    .getService(Service.Lightbulb)
    .addCharacteristic(Characteristic.Brightness)
    .on('set', function(value, callback) {
      device.setCapabilityValue('volume_set', value / 100)
      callback();
    })
    .on('get', function(callback) {
      callback(null, device.capabilitiesObj.volume_set.value * 100);
    });

  // On realtime event update the device
  for (let i in ['onoff', 'volume_set']) {
    let listener = async (value) => {
      onStateChange(device.capabilities[i], value, device);
    };

    device.makeCapabilityInstance(device.capabilities[i], listener);
  }
  
  async function onStateChange(capability, value, device) {

    console.log('State Change - ' + device.name + ' - ' + capability + ' - ' + value);
    
    homekitAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.On)
        .updateValue(device.capabilitiesObj.onoff.value);

    homekitAccessory
      .getService(Service.Lightbulb)
      .getCharacteristic(Characteristic.Brightness)
      .updateValue(device.capabilitiesObj.volume_set.value * 100);
  }
  
  // Return device to app.js
  return homekitAccessory
}
