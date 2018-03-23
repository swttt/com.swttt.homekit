const Accessory = require('hap-nodejs').Accessory;
const Service = require('hap-nodejs').Service;
const Characteristic = require('hap-nodejs').Characteristic;
const uuid = require('hap-nodejs').uuid;
const _ = require('lodash');

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
  // Onoff
  homekitAccessory
    .addService(Service.LockMechanism, device.name)
    .getCharacteristic(Characteristic.LockTargetState)
    .on('set', function(value, callback) {

      if (value == Characteristic.LockTargetState.UNSECURED) {
        device.setCapabilityValue("locked", false)
        homekitAccessory
          .getService(Service.LockMechanism)
          .setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.UNSECURED);
        callback();


      }
      else if (value == Characteristic.LockTargetState.SECURED) {
        device.setCapabilityValue("locked", true)
        homekitAccessory
          .getService(Service.LockMechanism)
          .setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED);
        callback();


      }

    })
    .on('get', function(callback) {
      var err = null;
      if (device.state.locked) {
        callback(err, Characteristic.LockCurrentState.SECURED);
      }
      else {
        callback(err, Characteristic.LockCurrentState.UNSECURED);
      }
    });




  // On realtime event update the device
  device.on('$state', _.debounce(state => {

    console.log('Realtime update from: ' + device.name)

    if (state.locked) {
      homekitAccessory
        .getService(Service.LockMechanism)
        .setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED);
    }
    else {
      homekitAccessory
        .getService(Service.LockMechanism)
        .setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.UNSECURED);
    }


  }));

  // Return device to app.js
  return homekitAccessory
}
