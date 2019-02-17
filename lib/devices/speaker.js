const Accessory                 = require('hap-nodejs').Accessory;
const Service                   = require('hap-nodejs').Service;
const Characteristic            = require('hap-nodejs').Characteristic;
const uuid                      = require('hap-nodejs').uuid;
const debounce                  = require('lodash.debounce');
const { returnCapabilityValue } = require('./utils');

module.exports = function(device, api, capabilities) {
  // Init device
  const homekitAccessory = new Accessory(device.name, device.id);

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

  // Add services and characteristics
  const speaker = homekitAccessory.addService(Service.Speaker, device.name);

  if ('volume_mute' in capabilities) {
    speaker
      .getCharacteristic(Characteristic.Mute)
      .on('set', function(value, callback) {
        device.setCapabilityValue('volume_mute', value)
        callback();
      })
      .on('get', returnCapabilityValue(device, 'volume_mute'));
  }

  if ('volume_set' in capabilities) {
    speaker
      .addCharacteristic(Characteristic.Volume)
      .on('set', debounce(function(value, callback) {
        device.setCapabilityValue('volume_set', value / 100)
        callback();
      }, 500))
      .on('get', returnCapabilityValue(device, 'volume_set', v => v * 100));
  }

  // On realtime event update the device
  for (let i in device.capabilities) {
    if (['volume_mute', 'volume_set'].includes(device.capabilities[i].split('.')[0])) {
      console.log('created listener for - ' + device.capabilities[i]);
      let listener = async (value) => {
        onStateChange(device.capabilities[i], value, device);
      };

      device.makeCapabilityInstance(device.capabilities[i], listener);
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
