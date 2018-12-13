const Accessory = require('hap-nodejs').Accessory;
const Service = require('hap-nodejs').Service;
const Characteristic = require('hap-nodejs').Characteristic;
const uuid = require('hap-nodejs').uuid;
const debounce = require('lodash.debounce');

function state2value(state)
{
  if (state == 'off')
  {
    return 0;
  }
  else if (state == 'heat')
  {
    return 1;
  }
  else if (state == 'cool')
  {
    return 2;
  }
  else {
    return 3;
  }
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
      device.setCapabilityValue('target_temperature', value)
      callback();
    })
    .on('get', function(callback) {
      var err = null;
      callback(err, device.capabilitiesObj['target_temperature'].value);
    });

  // Current Temperature
  homekitAccessory
    .getService(Service.Thermostat)
    .getCharacteristic(Characteristic.CurrentTemperature)
    .on('get', function(callback) {
      var err = null;
      callback(err, device.capabilitiesObj['measure_temperature'].value);
    });

  // Humidity Sensor	
  if ('measure_humidity' in capabilities) {
	  homekitAccessory
	    .getService(Service.Thermostat)
	    .getCharacteristic(Characteristic.CurrentRelativeHumidity)
	    .on('get', function(callback) {
	      callback(null, device.capabilitiesObj['measure_humidity'].value);
	    });
  }

  if ('thermostat_mode' in capabilities) {
    // Target state
    homekitAccessory
      .getService(Service.Thermostat)
      .getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .on('set', function(value, callback) {
        if (value == 0) {
          device.setCapabilityValue('thermostat_mode', 'off')
          callback();
        }
        else if (value == 1) {
          device.setCapabilityValue('thermostat_mode', 'heat')
          callback();
        }
        else if (value == 2) {
          device.setCapabilityValue('thermostat_mode', 'cool')
          callback();
        }
        else {
          device.setCapabilityValue('thermostat_mode', 'auto')
          callback();
        }

      })
      .on('get', function(callback) {
        var err = null;
        callback(err, state2value(device.capabilitiesObj['thermostat_mode'].value));
      });

    // Current State
    homekitAccessory
      .getService(Service.Thermostat)
      .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
      .on('get', function(callback) {
        var err = null;
        callback(err, state2value(device.capabilitiesObj['thermostat_mode'].value));
      });
  }


  // On realtime event update the device
  device.on('$capabilitiesObj', debounce(capabilitiesObj => {

    console.log('Realtime update from: ' + device.name)

    homekitAccessory
      .getService(Service.Thermostat)
      .getCharacteristic(Characteristic.TargetTemperature)
      .updateValue(capabilitiesObj['target_temperature'].value);

    homekitAccessory
      .getService(Service.Thermostat)
      .getCharacteristic(Characteristic.CurrentTemperature)
      .updateValue(capabilitiesObj['measure_temperature'].value);

    if ('measure_humidity' in capabilities) {
      homekitAccessory
          .getService(Service.Thermostat)
          .getCharacteristic(Characteristic.CurrentRelativeHumidity)
          .updateValue(capabilitiesObj['measure_humidity'].value);
    }

    if ('thermostat_mode' in capabilities) {
      homekitAccessory
        .getService(Service.Thermostat)
        .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
        .updateValue(state2value(capabilitiesObj['thermostat_mode'].value));
      }

  }));

  // Return device to app.js
  return homekitAccessory
}
