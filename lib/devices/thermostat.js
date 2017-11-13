const Accessory = require('hap-nodejs').Accessory;
const Service = require('hap-nodejs').Service;
const Characteristic = require('hap-nodejs').Characteristic;
const uuid = require('hap-nodejs').uuid;
const _ = require('lodash');

function state2value(state)
{
  if (state == 'off')
  {
    return 0;
  }
  else if (state === 'heat')
  {
    return 1;
  }
  else if (state === 'cool')
  {
    return 2;
  }
  else {
    return 3;
  }
}

function currentstate2value(state) {
  if (state === 'heat')
  {
    return 1
  }
  else if (state === 'cool')
  {
    return 2;
  }
  else if (state === 'auto')
  {
    return 2;
  }
  else
  {
    return 0;
  }
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
  // Temp display units
  homekitAccessory
    .addService(Service.Thermostat, device.name)
    .getCharacteristic(Characteristic.TemperatureDisplayUnits)
    .on('get', function(callback) {
      var err = null;
      callback(err, 0);
    });

  // Target temperature
  homekitAccessory
    .getService(Service.Thermostat)
    .getCharacteristic(Characteristic.TargetTemperature)
    .on('set', function(value, callback) {
      device.setCapabilityValue("target_temperature", value)
      callback();
    })
    .on('get', function(callback) {
      var err = null;
      callback(err, device.state.target_temperature);
    });

  // Current Temperature
  homekitAccessory
    .getService(Service.Thermostat)
    .getCharacteristic(Characteristic.CurrentTemperature)
    .on('get', function(callback) {
      var err = null;
      callback(err, device.state.measure_temperature);
    });

  if ('thermostat_mode' in device.capabilities) {

    // Target state
    homekitAccessory
      .getService(Service.Thermostat)
      .getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .on('set', function(value, callback) {
        if (value === 0) {
          device.setCapabilityValue("thermostat_mode", 'off')
          callback();
        }
        else if (value === 1) {
          device.setCapabilityValue("thermostat_mode", 'heat')
          callback();
        }
        else if (value === 2) {
          device.setCapabilityValue("thermostat_mode", 'cool')
          callback();
        }
        else {
          device.setCapabilityValue("thermostat_mode", 'auto')
          callback();
        }

      })
      .on('get', function(callback) {
        var err = null;
        callback(err, state2value(device.state.thermostat_mode));
      });

    // Current State
    homekitAccessory
      .getService(Service.Thermostat)
      .getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .on('get', function(callback) {
        var err = null;
        callback(err, currentstate2value(device.state.thermostat_mode));
      });
  }



  // On realtime event update the device
  device.on('$state', _.debounce(state => {

    console.log('Realtime update from: ' + device.name)

    homekitAccessory
      .getService(Service.Thermostat)
      .getCharacteristic(Characteristic.TargetTemperature)
      .updateValue(state.target_temperature);

    homekitAccessory
      .getService(Service.Thermostat)
      .getCharacteristic(Characteristic.CurrentTemperature)
      .updateValue(state.measure_temperature);

    if ('thermostat_mode' in device.capabilities) {
      homekitAccessory
        .getService(Service.Thermostat)
        .getCharacteristic(Characteristic.TargetHeatingCoolingState)
        .updateValue(state.thermostat_mode);
      }


  }));

  // Return device to app.js
  return homekitAccessory
}
