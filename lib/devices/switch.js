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
  var homekitAccessory = new Accessory(device.name, device.id);

  // Set device info
  setupAccessoryInformations(homekitAccessory, device);

  // Device identify when added
  homekitAccessory.on('identify', function(paired, callback) {
    console.log(device.name + ' identify');
    callback();
  });

  // Add services and characteristics
  // Onoff
  homekitAccessory
    .addService(Service.Switch, device.name)
    .getCharacteristic(Characteristic.On)
    .on('set', function(value, callback) {
      device.setCapabilityValue('onoff', value)
      callback();
    })
    .on('get', returnCapabilityValue(device, 'onoff'));

  // On realtime event update the device
  for (let i in device.capabilities) {
    if (['onoff'].includes(device.capabilities[i].split('.')[0])) {
      console.log('created listener for - ' + device.capabilities[i]);
      let listener = async (value) => {
        onStateChange(device.capabilities[i], value, device);
      };

      device.makeCapabilityInstance(device.capabilities[i], listener);
    }
  }

  async function onStateChange(capability, value, device) {
    console.log('State Change - ' + device.name + ' - ' + capability + ' - ' + value);
    homekitAccessory
      .getService(Service.Switch)
      .getCharacteristic(Characteristic.On)
      .updateValue(value);
  }

  // Return device to app.js
  return homekitAccessory
}
