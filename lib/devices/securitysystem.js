const Accessory              = require('hap-nodejs').Accessory;
const Service                = require('hap-nodejs').Service;
const Characteristic         = require('hap-nodejs').Characteristic;
const uuid                   = require('hap-nodejs').uuid;
const debounce               = require('lodash.debounce');
const {
  getCapabilityValue, 
  setupAccessoryInformations 
}                               = require('./utils');

function state2value(state, targetStateValue) {
  if (state === 'partially_armed') {
    if (targetStateValue === 0) {
      return 0;
    } else if (targetStateValue === 2) {
      return 2;
    } else {
      return 0
    }
  } else if (state === 'armed') {
    return 1;
  } else if (state === 'disarmed') {
    return 3;
  } else {
    return 3;
  }
}

function value2state(value) {
  if (value === 0) {
    return 'partially_armed'
  } else if (value === 1) {
    return 'armed';
  } else if (value === 2) {
    return 'partially_armed';
  } else if (value === 3) {
    return 'disarmed';
  } else {
    return 'disarmed';
  }
}

module.exports = function(device, api, capabilities) {
  // Init device
  let homekitAccessory = new Accessory(device.name || 'Security System', device.id);

  // Var that keeps the target state
  let targetStateValue = null;

  // Set device info
  setupAccessoryInformations(homekitAccessory, device);

  // Device identify when added
  homekitAccessory.on('identify', function(paired, callback) {
    console.log(device.name + ' identify');
    callback();
  });

  // Add services and characteristics
  // Current state
  homekitAccessory
    .addService(Service.SecuritySystem, device.name)
    .getCharacteristic(Characteristic.SecuritySystemCurrentState)
    .on('get', function(callback) {
      // Support for Heimdall app alarm capability
      if ('alarm_heimdall' in device.capabilitiesObj && device.capabilitiesObj.alarm_heimdall.value === true) {
        return callback(null, 4);
      } else if ('homealarm_state' in capabilities) {
        const value = getCapabilityValue(device, 'homealarm_state');
        return callback(null, value !== null ? state2value(value, targetStateValue) : this.value);
      } else if ('onoff' in capabilities) { // Satel Integra
        const value = getCapabilityValue(device, 'onoff');
        return callback(null, value !== null ? state2value(value ? 'armed' : 'disarmed', targetStateValue) : this.value);
      }
      return callback(Error('NO_CAPABILITY'));
    });

  // Target state
  homekitAccessory
    .getService(Service.SecuritySystem)
    .getCharacteristic(Characteristic.SecuritySystemTargetState)
    .on('set', function(value, callback) {
      targetStateValue = value;
      if ('homealarm_state' in capabilities) {
        device.setCapabilityValue('homealarm_state', value2state(value) ).catch(() => {});
      } else if ('onoff' in capabilities) {
        device.setCapabilityValue('onoff', value === 3 ? false : true).catch(() => {});;
      }
      return callback();
    })
    .on('get', function(callback) {
      if ('homealarm_state' in capabilities) {
        const value = getCapabilityValue(device, 'homealarm_state');
        return callback(null, value !== null ? state2value(value, targetStateValue) : this.value);
      } else if ('onoff' in capabilities) { // Satel Integra
        const value = getCapabilityValue(device, 'onoff');
        return callback(null, value !== null ? state2value(value ? 'armed' : 'disarmed', targetStateValue) : this.value);
      }
      return callback(Error('NO_CAPABILITY'));
    });

  // Tamper
  if ('alarm_tamper' in capabilities) {
    homekitAccessory
      .getService(Service.SecuritySystem)
      .getCharacteristic(Characteristic.StatusTampered)
      .on('get', function(callback) {
        const value = getCapabilityValue(device, 'alarm_tamper');
        callback(null, value ? ~~value : this.value);
      });
  }

  // On realtime event update the device
  for (let i in device.capabilities) {
    if ([ 'alarm_heimdall', 'homealarm_state', 'alarm_tamper', 'onoff' ].includes(device.capabilities[i].split('.')[0])) {
      console.log('created listener for - ' + device.capabilities[i]);
      let listener = async (value) => {
        onStateChange(device.capabilities[i], value, device);
      };

      try { device.makeCapabilityInstance(device.capabilities[i], listener) } catch(e) {};
    }
  }

  async function onStateChange(capability, value, device) {
    console.log('State Change - ' + device.name + ' - ' + capability + ' - ' + value);
    const securitysystem = homekitAccessory.getService(Service.SecuritySystem);

    // Support for Heimdall app alarm capability
    if (capability == 'alarm_heimdall' && value == true) {
      securitysystem.getCharacteristic(Characteristic.SecuritySystemCurrentState)
        .updateValue(4);
    } else if (capability == 'homealarm_state') {
      securitysystem.getCharacteristic(Characteristic.SecuritySystemTargetState)
        .updateValue(state2value(value, targetStateValue));
      securitysystem.getCharacteristic(Characteristic.SecuritySystemCurrentState)
        .updateValue(state2value(value, targetStateValue));
    } else if (capability === 'onoff') {
      securitysystem.getCharacteristic(Characteristic.SecuritySystemTargetState)
        .updateValue(state2value(value ? 'armed' : 'disarmed', targetStateValue));
      securitysystem.getCharacteristic(Characteristic.SecuritySystemCurrentState)
        .updateValue(state2value(value ? 'armed' : 'disarmed', targetStateValue));
    } else if (capability === 'alarm_tamper') {
      securitysystem.getCharacteristic(Characteristic.StatusTampered)
        .updateValue(~~value);
    }
  }

  // Return device to app.js
  return homekitAccessory;
}
