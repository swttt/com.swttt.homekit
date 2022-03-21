const Accessory                 = require('hap-nodejs').Accessory;
const Service                   = require('hap-nodejs').Service;
const Characteristic            = require('hap-nodejs').Characteristic;
const uuid                      = require('hap-nodejs').uuid;
const debounce                  = require('lodash.debounce');
const {
  getCapabilityValue, 
  setupAccessoryInformations 
}                               = require('./utils');

module.exports = function(device, api) {

  // Init device
  var homekitAccessory = new Accessory(device.name || 'Lock', device.id);

  // Set device info
  setupAccessoryInformations(homekitAccessory, device);

  // Device identify when added
  homekitAccessory.on('identify', function(paired, callback) {
    console.log(device.name + ' identify');
    callback();
  });

  // Add services and charesteristics

  // Handler to get LockCurrentState and LockTargetState
  const onGetLockState = function(callback) {
    const locked = getCapabilityValue(device, 'locked');
    callback(null, Characteristic.LockCurrentState[ locked ? 'SECURED' : 'UNSECURED' ]);
  };

  // CurrentState
  homekitAccessory
    .addService(Service.LockMechanism, device.name)
    .getCharacteristic(Characteristic.LockCurrentState)
    .on('get', onGetLockState);

  // TargetState
  homekitAccessory
    .getService(Service.LockMechanism, device.name)
    .getCharacteristic(Characteristic.LockTargetState)
    .on('set', function(value, callback) {

      if (value == Characteristic.LockTargetState.SECURED) {
        device.setCapabilityValue('locked', true).catch(() => {});
        callback();
      }
      else if (value == Characteristic.LockTargetState.UNSECURED) {
        device.setCapabilityValue('locked', false).catch(() => {});
        callback();
      }
    })
    .on('get', onGetLockState);

  // On realtime event update the device
  for (let i in device.capabilities) {
    if (['locked'].includes(device.capabilities[i].split('.')[0])) {
      console.log('created listener for - ' + device.capabilities[i]);
      let listener = async (value) => {
        onStateChange(device.capabilities[i], value, device);
      };

      try { device.makeCapabilityInstance(device.capabilities[i], listener) } catch(e) {};
    }
  }

  async function onStateChange(capability, value, device) {
    console.log('State Change - ' + device.name + ' - ' + capability + ' - ' + value);
    const lock = homekitAccessory.getService(Service.LockMechanism);

    if (value) {
      lock.setCharacteristic(Characteristic.LockTargetState, Characteristic.LockTargetState.SECURED);
      lock.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED);
    } else {
      lock.setCharacteristic(Characteristic.LockTargetState, Characteristic.LockTargetState.UNSECURED);
      lock.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.UNSECURED);
    }
  }

  // Return device to app.js
  return homekitAccessory
}
