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
      callback(err, device.capabilitiesObj.target_temperature.value);
    });

  // Current Temperature
  homekitAccessory
    .getService(Service.Thermostat)
    .getCharacteristic(Characteristic.CurrentTemperature)
    .on('get', function(callback) {
      var err = null;
      callback(err, device.capabilitiesObj.measure_temperature.value);
    });

  // Humidity Sensor	
  if ('measure_humidity' in capabilities) {
	  homekitAccessory
	    .getService(Service.Thermostat)
	    .getCharacteristic(Characteristic.CurrentRelativeHumidity)
	    .on('get', function(callback) {
	      callback(null, device.capabilitiesObj.measure_humidity.value);
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
        callback(err, state2value(device.capabilitiesObj.thermostat_mode.value));
      });

    // Current State
    homekitAccessory
      .getService(Service.Thermostat)
      .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
      .on('get', function(callback) {
        var err = null;
        callback(err, state2value(device.capabilitiesObj.thermostat_mode.value));
      });
  }


  // On realtime event update the device
  for (let i in device.capabilities) {
    if (['target_temperature','measure_temperature','measure_humidity','thermostat_mode'].includes(device.capabilities[i].split('.')[0])) {
      console.log('created listener for - ' + device.capabilities[i]);
      let listener = async (value) => {
        onStateChange(device.capabilities[i], value, device);
      };
      
      device.makeCapabilityInstance(device.capabilities[i], listener);
    }
  }
  
  async function onStateChange(capability, value, device) {

    console.log('State Change - ' + device.name + ' - ' + capability + ' - ' + value);
	
	const thermostat = homekitAccessory.getService(Service.Thermostat);

    if (capability == 'target_temperature') {	
  	  thermostat.getCharacteristic(Characteristic.TargetTemperature)
   	    .updateValue(value);
    }
		
	else if (capability == 'measure_temperature') { 
      thermostat.getCharacteristic(Characteristic.CurrentTemperature)
        .updateValue(value);
    }
	
    else if (capability == 'measure_humidity') {
      thermostat.getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .updateValue(value);
    }

    else if (capability == 'thermostat_mode') {
      thermostat.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
        .updateValue(value);
    }    
  }

  // Return device to app.js
  return homekitAccessory
}
