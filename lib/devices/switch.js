const { Accessory, Service, Characteristic }                = require('../../modules/hap-nodejs');
const debounce                                              = require('lodash.debounce');
const { returnCapabilityValue, setupAccessoryInformations } = require('./utils');

module.exports = function(device, api) {

  // Init device
  var homekitAccessory = new Accessory(device.name || 'Switch', device.id);

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
      device.setCapabilityValue('onoff', value).catch(() => {});
      callback();
    })
    .on('get', returnCapabilityValue(device, 'onoff'));

  // On realtime event update the device
  for (let i in device.capabilities) {
    if (device.capabilities[i] && ['onoff'].includes(device.capabilities[i].split('.')[0])) {
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
      .getService(Service.Switch)
      .getCharacteristic(Characteristic.On)
      .updateValue(value);
  }

  // Return device to app.js
  return homekitAccessory
}
