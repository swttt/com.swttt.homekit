const { Accessory, Service, Characteristic }                = require('../../modules/hap-nodejs');
const debounce                                              = require('lodash.debounce');
const { returnCapabilityValue, setupAccessoryInformations } = require('./utils');

module.exports = function(device, api) {

  // Init device
  var homekitAccessory = new Accessory(device.name || 'Blinds', device.id);

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
    .on('get', returnCapabilityValue(device, 'dim', v => v * 100));

  // Targetposition
  homekitAccessory
    .getService(Service.WindowCovering, device.name)
    .getCharacteristic(Characteristic.TargetPosition)
    .on('set', debounce(function(value, callback) {
      device.setCapabilityValue('dim', value / 100).catch(() => {});;
      callback();
    }, 500))
    .on('get', returnCapabilityValue(device, 'dim', v => v * 100));

  // PositionState
  /*
  homekitAccessory
    .getService(Service.WindowCovering, device.name)
    .getCharacteristic(Characteristic.PositionState)
    .on('get', function(callback) {
      callback(null, 2);
    });
  */

  // On realtime event update the device
  for (let i in device.capabilities) {
    if (device.capabilities[i] && ['dim'].includes(device.capabilities[i].split('.')[0])) {
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
