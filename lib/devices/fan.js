const Accessory = require('hap-nodejs').Accessory;
const Service = require('hap-nodejs').Service;
const Characteristic = require('hap-nodejs').Characteristic;
const uuid = require('hap-nodejs').uuid;
const debounce = require('lodash.debounce');

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

  // Add services and characteristics
  // Onoff
  homekitAccessory
    .addService(Service.Fan, device.name)
    .getCharacteristic(Characteristic.On)
    .on('set', function(value, callback) {
      device.setCapabilityValue('onoff', value)
      callback();
    })
    .on('get', function(callback) {
      callback(null, device.capabilitiesObj['onoff'].value);
    });

  // FanSpeed
  if ('dim' in capabilities) {
    homekitAccessory
      .getService(Service.Fan)
      .addCharacteristic(Characteristic.RotationSpeed)
      .on('set', function(value, callback) {
        device.setCapabilityValue('dim', value / 100)
        callback();
      })
      .on('get', function(callback) {
        callback(null, device.capabilitiesObj['dim'].value * 100);
      });
  }

  // On realtime event update the device
  device.on('$capabilitiesObj', debounce(capabilitiesObj => {

    console.log('Realtime update from: ' + device.name)

    homekitAccessory
      .getService(Service.Fan)
      .getCharacteristic(Characteristic.On)
      .updateValue(capabilitiesObj.onoff);

    if ('dim' in capabilities) {
      homekitAccessory
        .getService(Service.Fan)
        .getCharacteristic(Characteristic.RotationSpeed)
        .updateValue(capabilitiesObj['dim'].value * 100);
    }

  }));

  // Return device to app.js
  return homekitAccessory
}
