const Accessory                 = require('hap-nodejs').Accessory;
const Service                   = require('hap-nodejs').Service;
const Characteristic            = require('hap-nodejs').Characteristic;
const uuid                      = require('hap-nodejs').uuid;
const debounce                  = require('lodash.debounce');
const {
  getCapabilityValue, 
  isCapability,
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

  // Open/Close states
  for (const capability of device.capabilities.filter(c => isCapability(c, 'garagedoor_closed'))) {
    // Handler to get CurrentDoorState and TargetDoorState
    const onGetDoorState = function(callback) {
      const closed = getCapabilityValue(device, capability);
      callback(null, Characteristic.CurrentDoorState[ closed ? 'CLOSED' : 'OPEN' ]);
    };

    opener.getCharacteristic(Characteristic.CurrentDoorState)
          .on('get', onGetDoorState)

    opener.getCharacteristic(Characteristic.TargetDoorState)
          .on('get', onGetDoorState)
          .on('set', (value, callback) => {
            // 0 = OPEN, 1 = CLOSED
            device.setCapabilityValue(capability, value === Characteristic.TargetDoorState.CLOSED ? true : false).catch(() => {});
            callback();
          });

    // Watch for state changes
    try {
      device.makeCapabilityInstance(capability, isClosed => {
        console.log('State Change - ' + device.name + ' - ' + capability + ' - ' + isClosed);

        const newState = Characteristic.CurrentDoorState[ isClosed ? 'CLOSED' : 'OPEN' ];

        opener.getCharacteristic(Characteristic.CurrentDoorState) .updateValue(newState);
        opener.getCharacteristic(Characteristic.TargetDoorState)  .updateValue(newState);
      })
    } catch(e) {};
  }

  // Obstruction state
  for (const capability of device.capabilities.filter(c => isCapability(c, 'alarm_generic'))) {
    opener.getCharacteristic(Characteristic.ObstructionDetected)
          .on('get', callback => callback(null, getCapabilityValue(device, capability) ? true : false));

    try {
      device.makeCapabilityInstance(capability, alarmActive => {
        console.log('State Change - ' + device.name + ' - ' + capability + ' - ' + alarmActive);
        opener.getCharacteristic(Characteristic.ObstructionDetected).updateValue(alarmActive ? true : false);
      })
    } catch(e) {};
  }

  // Return accessory to app.js
  return homekitAccessory;
}
