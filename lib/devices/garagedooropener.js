const Accessory                 = require('hap-nodejs').Accessory;
const Service                   = require('hap-nodejs').Service;
const Characteristic            = require('hap-nodejs').Characteristic;
const uuid                      = require('hap-nodejs').uuid;
const debounce                  = require('lodash.debounce');
const {
  returnCapabilityValue,
  setupAccessoryInformations
}                               = require('./utils');

module.exports = function(device, api, capabilities) {
  const homekitAccessory = new Accessory(device.name || 'Garage door', device.id);

  // Set device info
  setupAccessoryInformations(homekitAccessory, device);

  // Device identify when added
  homekitAccessory.on('identify', function(paired, callback) {
    console.log(device.name + ' identify');
    callback();
  });

  // Add services and characteristics
  const opener = homekitAccessory.addService(Service.GarageDoorOpener, device.name);

  opener.getCharacteristic(Characteristic.CurrentDoorState)
        // 0 = OPEN, 1 = CLOSED, 2 = OPENING, 3 = CLOSING, 4 = STOPPED
        .on('get', returnCapabilityValue(device, 'garagedoor_closed', isClosed => isClosed ? 1 : 0));

  opener.getCharacteristic(Characteristic.TargetDoorState)
        .on('get', returnCapabilityValue(device, 'garagedoor_closed', isClosed => isClosed ? 1 : 0))
        .on('set', debounce((value, callback) => {
          // 0 = OPEN, 1 = CLOSED
          device.setCapabilityValue('garagedoor_closed', value === 1 ? true : false).catch(() => {});
          callback();
        }, 500));

  opener.getCharacteristic(Characteristic.ObstructionDetected)
        .on('get', returnCapabilityValue(device, 'garagedoor_closed', isClosed => isClosed ? 1 : 0));

  // Watch for state changes
  try {
    device.makeCapabilityInstance('garagedoor_closed', isClosed => {
      console.log('State Change - ' + device.name + ' - ' + capability + ' - ' + value);

      opener.getCharacteristic(Characteristic.CurrentDoorState) .updateValue(isClosed ? 1 : 0);
      opener.getCharacteristic(Characteristic.TargetDoorState)  .updateValue(isClosed ? 1 : 0);
    })
  } catch(e) {};


  // Return accessory to app.js
  return homekitAccessory;
}
