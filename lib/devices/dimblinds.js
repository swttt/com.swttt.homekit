const Accessory = require('hap-nodejs').Accessory;
const Service = require('hap-nodejs').Service;
const Characteristic = require('hap-nodejs').Characteristic;
const uuid = require('hap-nodejs').uuid;
const debounce = require('lodash.debounce');

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

  // Add services and characteristics

  // Currentposition
  homekitAccessory
    .addService(Service.WindowCovering, device.name)
    .getCharacteristic(Characteristic.CurrentPosition)
    .on('get', function(callback) {
      callback(null, device.capabilitiesObj['dim'].value * 100);
    });

  // Targetposition
  homekitAccessory
    .getService(Service.WindowCovering, device.name)
    .getCharacteristic(Characteristic.TargetPosition)
    .on('set', function(value, callback) {
      console.log('Setting blinds to: ' + value);
      device.setCapabilityValue('dim', value / 100);
      callback();
    })
    .on('get', function(callback) {
      callback(null, device.capabilitiesObj['dim'].value * 100);
    });

  // PositionState
  homekitAccessory
    .getService(Service.WindowCovering, device.name)
    .getCharacteristic(Characteristic.PositionState)
    .on('get', function(callback) {
      callback(null, 2);
    });


  // On realtime event update the device
  device.on('$update', id => {

    console.log('Realtime update from: ' + device.name)

    homekitAccessory
      .getService(Service.WindowCovering)
      .getCharacteristic(Characteristic.CurrentPosition)
      .updateValue(device.capabilitiesObj['dim'].value * 100);

    homekitAccessory
      .getService(Service.WindowCovering)
      .getCharacteristic(Characteristic.PositionState)
      .updateValue(device.capabilitiesObj['dim'].value * 100);

  });

  // Return device to app.js
  return homekitAccessory
}
