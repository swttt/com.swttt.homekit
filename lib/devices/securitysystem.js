const Accessory              = require('hap-nodejs').Accessory;
const Service                = require('hap-nodejs').Service;
const Characteristic         = require('hap-nodejs').Characteristic;
const uuid                   = require('hap-nodejs').uuid;
const debounce               = require('lodash.debounce');
const { getCapabilityValue } = require('./utils');

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

  // Var that keeps the target state
  var targetStateValue = null;

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
  // Current state
  homekitAccessory
    .addService(Service.SecuritySystem, device.name)
    .getCharacteristic(Characteristic.SecuritySystemCurrentState)
    .on('get', function(callback) {
      //support for Heimdall app alarm capability
      if ('alarm_heimdall' in device.capabilitiesObj && device.capabilitiesObj.alarm_heimdall.value === true){
        callback(null, 4);
      } else {
        const value = getCapabilityValue(device, 'homealarm_state');
        callback(null, value ? state2value(value, targetStateValue) : this.value);
      }
    });

  // Target capabilitiesObj
  homekitAccessory
    .getService(Service.SecuritySystem)
    .getCharacteristic(Characteristic.SecuritySystemTargetState)
    .on('set', function(value, callback) {
    targetStateValue = value;
      device.setCapabilityValue('homealarm_state', value2state(value) )
      callback();
    })
    .on('get', function(callback) {
      const value = getCapabilityValue(device, 'homealarm_state');
      callback(null, value ? state2value(value, targetStateValue) : this.value);
    });

  // Tamper
  if('alarm_tamper' in device.capabilities){
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
    if (['alarm_heimdall','homealarm_state','alarm_tamper'].includes(device.capabilities[i].split('.')[0])) {
      console.log('created listener for - ' + device.capabilities[i]);
      let listener = async (value) => {
        onStateChange(device.capabilities[i], value, device);
      };

      device.makeCapabilityInstance(device.capabilities[i], listener);
    }
  }

  async function onStateChange(capability, value, device) {

    console.log('State Change - ' + device.name + ' - ' + capability + ' - ' + value);

  const securitysystem = homekitAccessory.getService(Service.SecuritySystem);

  //support for Heimdall app alarm capability
  if (capability == 'alarm_heimdall' && value == true){
      securitysystem.getCharacteristic(Characteristic.SecuritySystemCurrentState)
        .updateValue(4);
  }

  else if (capability == 'homealarm_state') {
      securitysystem.getCharacteristic(Characteristic.SecuritySystemTargetState)
      .updateValue(state2value(value, targetStateValue));

    securitysystem.getCharacteristic(Characteristic.SecuritySystemCurrentState)
      .updateValue(state2value(value, targetStateValue));
  }

    else if (capability == 'alarm_tamper'){
      securitysystem.getCharacteristic(Characteristic.StatusTampered)
        .updateValue(~~value);
    }
  }

  // Return device to app.js
  return homekitAccessory
}
