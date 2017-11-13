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
  // Contact
  homekitAccessory
    .addService(Service.ContactSensor, device.name)
    .getCharacteristic(Characteristic.ContactSensorState)
    .on('get', function(callback) {
      callback(null, ~~device.state.alarm_contact);
    });

  // Tamper
  if('alarm_tamper' in device.capabilities){
  homekitAccessory
    .getService(Service.ContactSensor)
    .getCharacteristic(Characteristic.StatusTampered)
    .on('get', function(callback) {
      callback(null, ~~device.state.alarm_tamper);
    });
  }

  // Battery
  if('alarm_battery' in device.capabilities){
  homekitAccessory
    .getService(Service.ContactSensor)
    .getCharacteristic(Characteristic.StatusLowBattery)
    .on('get', function(callback) {
      callback(null, ~~device.state.alarm_battery);
    });
  }

  // Luminance
  if ('measure_luminance' in device.capabilities) {
    homekitAccessory
      .addService(Service.LightSensor, device.name)
      .getCharacteristic(Characteristic.CurrentAmbientLightLevel)
      .on('get', function(callback) {
        callback(null, device.state.measure_luminance);
      });
  }

  // Temperature
  if (device.state.measure_temperature) {
    homekitAccessory
      .addService(Service.TemperatureSensor, device.name)
      .getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', function(callback) {
        callback(null, device.state.measure_temperature);
      });
  }

  // On realtime event update the device
  device.on('$state', _.debounce(state => {

    console.log('Realtime update from: ' + device.name)

    homekitAccessory
      .getService(Service.ContactSensor)
      .getCharacteristic(Characteristic.ContactSensorState)
      .updateValue(state.alarm_contact);

    if('alarm_tamper' in device.capabilities){
      homekitAccessory
        .getService(Service.ContactSensor)
        .getCharacteristic(Characteristic.StatusTampered)
        .updateValue(state.alarm_tamper);
    }

    if('alarm_battery' in device.capabilities){
      homekitAccessory
        .getService(Service.ContactSensor)
        .getCharacteristic(Characteristic.StatusLowBattery)
        .updateValue(state.alarm_battery);
    }

    if ('measure_luminance' in device.capabilities) {
      homekitAccessory
        .getService(Service.LightSensor)
        .getCharacteristic(Characteristic.CurrentAmbientLightLevel)
        .updateValue(state.measure_luminance);
    }

    if (state.measure_temperature) {
      homekitAccessory
        .getService(Service.TemperatureSensor)
        .getCharacteristic(Characteristic.CurrentTemperature)
        .updateValue(state.measure_temperature);
    }

  }));

  // Return device to app.js
  return homekitAccessory
}
