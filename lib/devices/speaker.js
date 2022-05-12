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
  const homekitAccessory = new Accessory(device.name || 'Speaker', device.id);

  // Set device info
  setupAccessoryInformations(homekitAccessory, device);

  // Device identify when added
  homekitAccessory.on('identify', function(paired, callback) {
    console.log(device.name + ' identify');
    callback();
  });

  // Add services and characteristics
  const speaker = homekitAccessory.addService(Service.Speaker, device.name);

  if ('volume_mute' in capabilities) {
    speaker
      .getCharacteristic(Characteristic.Mute)
      .on('set', function(value, callback) {
        device.setCapabilityValue('volume_mute', value).catch(() => {});
        callback();
      })
      .on('get', returnCapabilityValue(device, 'volume_mute'));
  }

  if ('volume_set' in capabilities) {
    speaker
      .addCharacteristic(Characteristic.Volume)
      .on('set', debounce(function(value, callback) {
        device.setCapabilityValue('volume_set', value / 100).catch(() => {});
        callback();
      }, 500))
      .on('get', returnCapabilityValue(device, 'volume_set', v => v * 100));
  }

  // On realtime event update the device
  for (let i in device.capabilities) {
    if (device.capabilities[i] && ['volume_mute', 'volume_set'].includes(device.capabilities[i].split('.')[0])) {
      console.log('created listener for - ' + device.capabilities[i]);
      let listener = async (value) => {
        onStateChange(device.capabilities[i], value, device);
      };

      try { device.makeCapabilityInstance(device.capabilities[i], listener) } catch(e) {};
    }
  }

  async function onStateChange(capability, value, device) {
    console.log('State Change - ' + device.name + ' - ' + capability + ' - ' + value);
    const speaker = homekitAccessory.getService(Service.Speaker);

    if (capability === 'volume_mute') {
      speaker.getCharacteristic(Characteristic.Mute).updateValue(value);
    } else if (capability === 'volume_set') {
      speaker.getCharacteristic(Characteristic.Volume).updateValue(value * 100);
    }
  }

  // Return device to app.js
  return homekitAccessory;
}
