const Accessory                 = require('hap-nodejs').Accessory;
const Service                   = require('hap-nodejs').Service;
const Characteristic            = require('hap-nodejs').Characteristic;
const uuid                      = require('hap-nodejs').uuid;
const debounce                  = require('lodash.debounce');
const {
  returnCapabilityValue,
  setupAccessoryInformations
}                               = require('./utils');

module.exports = function(device, api) {

  // Init device
  var homekitAccessory = new Accessory(device.name || 'Doorbell', device.id);

  // Set device info
  setupAccessoryInformations(homekitAccessory, device);

  // Device identify when added
  homekitAccessory.on('identify', function(paired, callback) {
    console.log(device.name + ' identify');
    callback();
  });

  // Add services and characteristics
  // Motion
  homekitAccessory
    .addService(Service.MotionSensor, device.name)
    .getCharacteristic(Characteristic.MotionDetected)
    .on('get', returnCapabilityValue(device, 'alarm_generic'));

  // On realtime event update the device
  for (let i in device.capabilities) {
    if (device.capabilities[i] && ['alarm_generic'].includes(device.capabilities[i].split('.')[0])) {
      console.log('created listener for - ' + device.capabilities[i]);
      let listener = async (value) => {
        onStateChange(device.capabilities[i], value, device);
      };

      try { device.makeCapabilityInstance(device.capabilities[i], listener) } catch(e) {};
    }
  }

  async function onStateChange(capability, value, device) {
    console.log('State Change - ' + device.name + ' - ' + capability + ' - ' + value);
    homekitAccessory
      .getService(Service.MotionSensor)
      .getCharacteristic(Characteristic.MotionDetected)
      .updateValue(~~value);
  }

  // Return device to app.js
  return homekitAccessory
}
