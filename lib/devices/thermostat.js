const Accessory                 = require('hap-nodejs').Accessory;
const Service                   = require('hap-nodejs').Service;
const Characteristic            = require('hap-nodejs').Characteristic;
const uuid                      = require('hap-nodejs').uuid;
const debounce                  = require('lodash.debounce');
const {
  returnCapabilityValue, 
  setupAccessoryInformations 
}                               = require('./utils');

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

function vertical2value(vertical) {
  if (vertical === 'swing') {
    return 90;
  } else if (vertical === 'top') {
    return 60;
  } else if (vertical === 'middletop') {
    return 30;
  } else if (vertical === 'middle') {
    return 0;
  } else if (vertical === 'middlebottom') {
    return -30;
  } else if (vertical === 'bottom') {
    return -60;
  } else {  // auto
    return -90;
  }
}

function horizontal2value(horizontal) {
  if (horizontal === 'swing') {
    return 90;
  } else if (horizontal === 'right') {
    return 60;
  } else if (horizontal === 'middleright') {
    return 30;
  } else if (horizontal === 'middle') {
    return 0;
  } else if (horizontal === 'middleleft') {
    return -30;
  } else if (horizontal === 'left') {
    return -60;
  } else {  // auto
    return -90;
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

    // Current state
    homekitAccessory
      .getService(Service.Thermostat)
      .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
      .on('get', returnCapabilityValue(device, 'thermostat_mode', state2value));
  }

  // MELCloud fan support
  if ('fan_power' in capabilities) {
    homekitAccessory
      .addService(Service.Fan, device.name)
      .getCharacteristic(Characteristic.RotationSpeed)
      .on('set', debounce(function(value, callback) {
        device.setCapabilityValue('fan_power', value / 5).catch(() => {});
        callback();
      }, 500))
      .on('get', returnCapabilityValue(device, 'fan_power', v => v * 5));

      // Vertical Vane Position
      if ('vertical' in capabilities) {
        // Target state
        homekitAccessory
          .getService(Service.Fan)
          .getCharacteristic(Characteristic.TargetVerticalTilt)
          .on('set', function(value, callback) {
            if (value == 90) {
              device.setCapabilityValue('vertical', 'swing').catch(() => {});
              callback();
            } else if (value >= 60) {
              device.setCapabilityValue('vertical', 'top').catch(() => {});
              callback();
            } else if (value >= 30) {
              device.setCapabilityValue('vertical', 'middletop').catch(() => {});
              callback();
            } else if (value >= 0) {
              device.setCapabilityValue('vertical', 'middle').catch(() => {});
              callback();
            } else if (value >= -30) {
              device.setCapabilityValue('vertical', 'middlebottom').catch(() => {});
              callback();
            } else if (value >= -60) {
              device.setCapabilityValue('vertical', 'bottom').catch(() => {});
              callback();
            } else {
              device.setCapabilityValue('vertical', 'auto').catch(() => {});
              callback();
            }
          })
          .on('get', returnCapabilityValue(device, 'vertical', vertical2value));

        // Current state
        homekitAccessory
          .getService(Service.Fan)
          .getCharacteristic(Characteristic.CurrentVerticalTilt)
          .on('get', returnCapabilityValue(device, 'vertical', vertical2value));
      }

      // Horizontal Vane Position
      if ('horizontal' in capabilities) {
        // Target state
        homekitAccessory
          .getService(Service.Fan)
          .getCharacteristic(Characteristic.TargetHorizontalTilt)
          .on('set', function(value, callback) {
            if (value == 90) {
              device.setCapabilityValue('horizontal', 'swing').catch(() => {});
              callback();
            } else if (value >= 60) {
              device.setCapabilityValue('horizontal', 'right').catch(() => {});
              callback();
            } else if (value >= 30) {
              device.setCapabilityValue('horizontal', 'middleright').catch(() => {});
              callback();
            } else if (value >= 0) {
              device.setCapabilityValue('horizontal', 'middle').catch(() => {});
              callback();
            } else if (value >= -30) {
              device.setCapabilityValue('horizontal', 'middleleft').catch(() => {});
              callback();
            } else if (value >= -60) {
              device.setCapabilityValue('horizontal', 'left').catch(() => {});
              callback();
            } else {
              device.setCapabilityValue('horizontal', 'auto').catch(() => {});
              callback();
            }
          })
          .on('get', returnCapabilityValue(device, 'horizontal', horizontal2value));

        // Current state
        homekitAccessory
          .getService(Service.Fan)
          .getCharacteristic(Characteristic.CurrentHorizontalTilt)
          .on('get', returnCapabilityValue(device, 'horizontal', horizontal2value));
      }
  }

  // On realtime event update the device
  for (let i in device.capabilities) {
    if (device.capabilities[i] && ['target_temperature','measure_temperature','measure_humidity','thermostat_mode','fan_power','vertical','horizontal'].includes(device.capabilities[i].split('.')[0])) {
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
    const fan = homekitAccessory.getService(Service.Fan);

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
        .updateValue(value);
    } else if (capability == 'fan_power') {
      fan.getCharacteristic(Characteristic.RotationSpeed)
        .updateValue(value * 5);
    } else if (capability == 'vertical') {
      fan.getCharacteristic(Characteristic.CurrentVerticalTilt)
        .updateValue(value);
    } else if (capability == 'horizontal') {
      fan.getCharacteristic(Characteristic.CurrentHorizontalTilt)
        .updateValue(value);
    }
  }

  // Return device to app.js
  return homekitAccessory;
}
