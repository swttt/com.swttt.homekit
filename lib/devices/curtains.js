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
  var homekitAccessory = new Accessory(device.name || 'Curtains', device.id);

  // Set device info
  setupAccessoryInformations(homekitAccessory, device);

  // Device identify when added
  homekitAccessory.on('identify', function(paired, callback) {
    console.log(device.name + ' identify');
    callback();
  });

  // Add services and characteristics

  // Currentposition
  homekitAccessory
    .addService(Service.WindowCovering, device.name)
    .getCharacteristic(Characteristic.CurrentPosition)
    .on('get', returnCapabilityValue(device, 'windowcoverings_set', v => v * 100));

  // Targetposition
  homekitAccessory
    .getService(Service.WindowCovering, device.name)
    .getCharacteristic(Characteristic.TargetPosition)
    .on('set', debounce(function(value, callback) {
      device.setCapabilityValue('windowcoverings_set', value / 100).catch(() => {});;
      callback();
    }, 500))
    .on('get', returnCapabilityValue(device, 'windowcoverings_set', v => v * 100));

  // On realtime event update the device
  for (let i in device.capabilities) {
    if (device.capabilities[i] && ['windowcoverings_set'].includes(device.capabilities[i].split('.')[0])) {
      console.log('created listener for - ' + device.capabilities[i]);
      let listener = async (value) => {
        onStateChange(device.capabilities[i], value, device);
      };

      try { device.makeCapabilityInstance(device.capabilities[i], listener) } catch(e) {};
    }
  }

  async function onStateChange(capability, value, device) {
    console.log('State Change - ' + device.name + ' - ' + capability + ' - ' + value);
    const windowcovering = homekitAccessory.getService(Service.WindowCovering);

    windowcovering.getCharacteristic(Characteristic.CurrentPosition)
      .updateValue(value * 100);

    windowcovering.getCharacteristic(Characteristic.TargetPosition)
      .updateValue(value * 100);
  }

  // Return device to app.js
  return homekitAccessory
}
