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

  // Init device
  var homekitAccessory = new Accessory(device.name || 'Fan', device.id);

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
    .addService(Service.Fan, device.name)
    .getCharacteristic(Characteristic.On)
    .on('set', function(value, callback) {
      device.setCapabilityValue('onoff', value).catch(() => {});
      callback();
    })
    .on('get', returnCapabilityValue(device, 'onoff'));

  // FanSpeed
  if ('dim' in capabilities) {
    homekitAccessory
      .getService(Service.Fan)
      .addCharacteristic(Characteristic.RotationSpeed)
      .on('set', debounce(function(value, callback) {
        device.setCapabilityValue('dim', value / 100).catch(() => {});
        callback();
      }, 500))
      .on('get', returnCapabilityValue(device, 'dim', v => v * 100));
  }

  // On realtime event update the device
  for (let i in device.capabilities) {
    if (['onoff','dim'].includes(device.capabilities[i].split('.')[0])) {
      console.log('created listener for - ' + device.capabilities[i]);
      let listener = async (value) => {
        onStateChange(device.capabilities[i], value, device);
      };

      try { device.makeCapabilityInstance(device.capabilities[i], listener) } catch(e) {};
    }
  }

  async function onStateChange(capability, value, device) {
    console.log('State Change - ' + device.name + ' - ' + capability + ' - ' + value);
    const fan = homekitAccessory.getService(Service.Fan);

    if (capability === 'onoff') {
      fan.getCharacteristic(Characteristic.On).updateValue(value);
    } else if (capability === 'dim') {
      fan.getCharacteristic(Characteristic.RotationSpeed).updateValue(value * 100);
    }
  }

  // Return device to app.js
  return homekitAccessory;
}
