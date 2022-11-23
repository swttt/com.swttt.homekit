const { Accessory, Service, Characteristic }                = require('../../modules/hap-nodejs');
const debounce                                              = require('lodash.debounce');
const { returnCapabilityValue, setupAccessoryInformations } = require('./utils');

function state2value(state) {
  if (state === 'off') {
    return 0;
  } else if (state === 'heat') {
    return 1;
  } else if (state === 'cool') {
    return 2;
  } else {
    return 3;
  }
}

module.exports = function(device, api, capabilities) {

  // Init device
  var homekitAccessory = new Accessory(device.name || 'Thermostat', device.id);

  // Set device info
  setupAccessoryInformations(homekitAccessory, device);

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
      callback(null, 0);
    });

  // Target temperature
  homekitAccessory
    .getService(Service.Thermostat)
    .getCharacteristic(Characteristic.TargetTemperature)
    .on('set', function(value, callback) {
      device.setCapabilityValue('target_temperature', value).catch(() => {});
      callback();
    })
    .on('get', returnCapabilityValue(device, 'target_temperature'));

  // Current Temperature
  homekitAccessory
    .getService(Service.Thermostat)
    .getCharacteristic(Characteristic.CurrentTemperature)
    .on('get', returnCapabilityValue(device, 'measure_temperature'));

  // Humidity Sensor
  if ('measure_humidity' in capabilities) {
    homekitAccessory
      .getService(Service.Thermostat)
      .getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .on('get', returnCapabilityValue(device, 'measure_humidity'));
  }

  if ('thermostat_mode' in capabilities) {
    // Target state
    homekitAccessory
      .getService(Service.Thermostat)
      .getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .on('set', function(value, callback) {
        if (value == 0) {
          device.setCapabilityValue('thermostat_mode', 'off').catch(() => {});
          callback();
        } else if (value == 1) {
          device.setCapabilityValue('thermostat_mode', 'heat').catch(() => {});
          callback();
        } else if (value == 2) {
          device.setCapabilityValue('thermostat_mode', 'cool').catch(() => {});
          callback();
        } else {
          device.setCapabilityValue('thermostat_mode', 'auto').catch(() => {});
          callback();
        }

      })
      .on('get', returnCapabilityValue(device, 'thermostat_mode', state2value));

    // Current State
    homekitAccessory
      .getService(Service.Thermostat)
      .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
      .on('get', returnCapabilityValue(device, 'thermostat_mode', state2value));
  }


  // On realtime event update the device
  for (let i in device.capabilities) {
    if (device.capabilities[i] && ['target_temperature','measure_temperature','measure_humidity','thermostat_mode'].includes(device.capabilities[i].split('.')[0])) {
      console.log('created listener for - ' + device.capabilities[i]);
      let listener = async (value) => {
        onStateChange(device.capabilities[i], value, device);
      };

      try { device.makeCapabilityInstance(device.capabilities[i], listener) } catch(e) {};
    }
  }

  async function onStateChange(capability, value, device) {
    console.log('State Change - ' + device.name + ' - ' + capability + ' - ' + value);
    const thermostat = homekitAccessory.getService(Service.Thermostat);

    if (capability == 'target_temperature') {
      thermostat.getCharacteristic(Characteristic.TargetTemperature)
         .updateValue(value);
    } else if (capability == 'measure_temperature') {
      thermostat.getCharacteristic(Characteristic.CurrentTemperature)
        .updateValue(value);
    } else if (capability == 'measure_humidity') {
      thermostat.getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .updateValue(value);
    } else if (capability == 'thermostat_mode') {
      thermostat.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
        .updateValue(state2value(value));
    }
  }

  // Return device to app.js
  return homekitAccessory;
}
