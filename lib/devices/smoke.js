const Accessory = require('hap-nodejs').Accessory;
const Service = require('hap-nodejs').Service;
const Characteristic = require('hap-nodejs').Characteristic;
const uuid = require('hap-nodejs').uuid;
const _ = require('lodash');

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

  // Add services and characteristics
  // Smoke
  homekitAccessory
    .addService(Service.SmokeSensor, device.name)
    .getCharacteristic(Characteristic.SmokeDetected)
    .on('get', function(callback) {
      callback(null, device.state.alarm_smoke);
    });

  // Tamper
  if('alarm_tamper' in device.capabilities){
  homekitAccessory
    .getService(Service.SmokeSensor)
    .getCharacteristic(Characteristic.StatusTampered)
    .on('get', function(callback) {
      callback(null, ~~device.state.alarm_tamper);
    });
  }

  // Battery
  if('alarm_battery' in device.capabilities){
  homekitAccessory
    .getService(Service.SmokeSensor)
    .getCharacteristic(Characteristic.StatusLowBattery)
    .on('get', function(callback) {
      callback(null, ~~device.state.alarm_battery);
    });
  }

  // On realtime event update the device
  device.on('$state', _.debounce(state => {

    console.log('Realtime update from: ' + device.name)

    homekitAccessory
      .getService(Service.SmokeSensor)
      .getCharacteristic(Characteristic.SmokeDetected)
      .updateValue(~~state.alarm_motion);

    if('alarm_tamper' in device.capabilities){
      homekitAccessory
        .getService(Service.SmokeSensor)
        .getCharacteristic(Characteristic.StatusTampered)
        .updateValue(~~state.alarm_tamper);
    }

    if('alarm_battery' in device.capabilities){
      homekitAccessory
        .getService(Service.SmokeSensor)
        .getCharacteristic(Characteristic.StatusLowBattery)
        .updateValue(~~state.alarm_battery);
    }

  }));

  // Return device to app.js
  return homekitAccessory
}
