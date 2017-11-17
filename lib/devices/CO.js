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
  // CarbonMonoxideDetected
  homekitAccessory
    .addService(Service.CarbonMonoxideSensor, device.name)
    .getCharacteristic(Characteristic.CarbonMonoxideDetected)
    .on('get', function(callback) {
      callback(null, ~~device.state.alarm_co);
    });

  // Tamper
  if('alarm_tamper' in device.capabilities){
  homekitAccessory
    .getService(Service.CarbonMonoxideSensor)
    .getCharacteristic(Characteristic.StatusTampered)
    .on('get', function(callback) {
      callback(null, ~~device.state.alarm_tamper);
    });
  }

  // Battery
  if('alarm_battery' in device.capabilities){
  homekitAccessory
    .getService(Service.CarbonMonoxideSensor)
    .getCharacteristic(Characteristic.StatusLowBattery)
    .on('get', function(callback) {
      callback(null, ~~device.state.alarm_battery);
    });
  }

  // CarbonMonoxideLevel
  if('measure_co' in device.capabilities){
  homekitAccessory
    .getService(Service.CarbonMonoxideSensor)
    .getCharacteristic(Characteristic.CarbonMonoxideLevel)
    .on('get', function(callback) {
      callback(null, ~~device.state.measure_co);
    });
  }

  // On realtime event update the device
  device.on('$state', _.debounce(state => {

    console.log('Realtime update from: ' + device.name)

    homekitAccessory
      .getService(Service.CarbonMonoxideSensor)
      .getCharacteristic(Characteristic.CarbonMonoxideDetected)
      .updateValue(~~state.alarm_co);

    if('alarm_tamper' in device.capabilities){
      homekitAccessory
        .getService(Service.CarbonMonoxideSensor)
        .getCharacteristic(Characteristic.StatusTampered)
        .updateValue(~~state.alarm_tamper);
    }

    if('alarm_battery' in device.capabilities){
      homekitAccessory
        .getService(Service.CarbonMonoxideSensor)
        .getCharacteristic(Characteristic.StatusLowBattery)
        .updateValue(~~state.alarm_battery);
    }

	if('measure_co' in device.capabilities){
      homekitAccessory
        .getService(Service.CarbonMonoxideSensor)
        .getCharacteristic(Characteristic.CarbonMonoxideLevel)
        .updateValue(~~state.measure_co);
    }

  }));

  // Return device to app.js
  return homekitAccessory
}
