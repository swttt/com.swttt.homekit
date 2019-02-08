const Accessory                 = require('hap-nodejs').Accessory;
const Service                   = require('hap-nodejs').Service;
const Characteristic            = require('hap-nodejs').Characteristic;
const uuid                      = require('hap-nodejs').uuid;
const debounce                  = require('lodash.debounce');
const { returnCapabilityValue } = require('./utils');

module.exports = function(device, api) {

  // Init device
  var homekitAccessory = new Accessory(device.name, device.id);

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
      device.setCapabilityValue('dim', value / 100);
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
    if (['dim'].includes(device.capabilities[i].split('.')[0])) {
      console.log('created listener for - ' + device.capabilities[i]);
      let listener = async (value) => {
        onStateChange(device.capabilities[i], value, device);
      };

      device.makeCapabilityInstance(device.capabilities[i], listener);
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
