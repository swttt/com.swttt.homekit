const Accessory = require('hap-nodejs').Accessory;
const Service = require('hap-nodejs').Service;
const Characteristic = require('hap-nodejs').Characteristic;
const uuid = require('hap-nodejs').uuid;
const debounce = require('lodash.debounce');

module.exports = function(device, api) {

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
  
  // CurrentState
  homekitAccessory
    .addService(Service.LockMechanism, device.name)
    .getCharacteristic(Characteristic.LockCurrentState)
    .on('get', function(callback) {
      if (device.capabilitiesObj.locked.value) {
        callback(null, Characteristic.LockCurrentState.SECURED);
      }
      else {
        callback(null, Characteristic.LockCurrentState.UNSECURED);
      }
    });

  // TargetState
  homekitAccessory
    .getService(Service.LockMechanism, device.name)
    .getCharacteristic(Characteristic.LockTargetState)
    .on('set', function(value, callback) {

      if (value == Characteristic.LockTargetState.SECURED) {
        device.setCapabilityValue('locked', true)
        callback();
      }
      else if (value == Characteristic.LockTargetState.UNSECURED) {
        device.setCapabilityValue('locked', false)
        callback();
      }
    })
    .on('get', function(callback) {
      if (device.capabilitiesObj.locked.value) {
        callback(null, Characteristic.LockTargetState.SECURED);
      }
      else {
        callback(null, Characteristic.LockTargetState.UNSECURED);
      }
    });

  // On realtime event update the device
  for (let i in device.capabilities) {
    if (['locked'].includes(device.capabilities[i].split('.')[0])) {
      console.log('created listener for - ' + device.capabilities[i]);
      let listener = async (value) => {
        onStateChange(device.capabilities[i], value, device);
      };
      
      device.makeCapabilityInstance(device.capabilities[i], listener);
    }
  }
  
  async function onStateChange(capability, value, device) {

    console.log('State Change - ' + device.name + ' - ' + capability + ' - ' + value);
	
	const lock = homekitAccessory.getService(Service.LockMechanism);
    
	if (value) {
        lock.setCharacteristic(Characteristic.LockTargetState, Characteristic.LockTargetState.SECURED);
        lock.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED);
    }
    else {
		lock.setCharacteristic(Characteristic.LockTargetState, Characteristic.LockTargetState.UNSECURED);
        lock.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.UNSECURED);
    }
  }
  
  // Return device to app.js
  return homekitAccessory
}
