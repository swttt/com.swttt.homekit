const { Accessory, Service, Characteristic } = require('../../modules/hap-nodejs');
const debounce                               = require('lodash.debounce');
const {
  getCapabilityValue,
  isCapability,
  setupAccessoryInformations
} = require('./utils');

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

  // Add services and charesteristics for `locked` and any possible subcapabilities.
  for (const capability of device.capabilities.filter(c => isCapability(c, 'locked'))) {
    // Handler to get LockCurrentState and LockTargetState
    const onGetLockState = function(callback) {
      const locked = getCapabilityValue(device, capability);
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
          device.setCapabilityValue(capability, true).catch(() => {});
          callback();
        }
        else if (value == Characteristic.LockTargetState.UNSECURED) {
          device.setCapabilityValue(capability, false).catch(() => {});
          callback();
        }
      })
      .on('get', onGetLockState);

      console.log('created listener for - ' + capability);
      try {
        device.makeCapabilityInstance(capability, value => {
          onStateChange(capability, value, device);
        })
      } catch(e) {};
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
