const Accessory                 = require('hap-nodejs').Accessory;
const Service                   = require('hap-nodejs').Service;
const Characteristic            = require('hap-nodejs').Characteristic;
const uuid                      = require('hap-nodejs').uuid;
const debounce                  = require('lodash.debounce');
const { returnCapabilityValue } = require('./utils');

module.exports = function(device, api, capabilities) {

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
  // Onoff
  homekitAccessory
    .addService(Service.Fan, device.name)
    .getCharacteristic(Characteristic.On)
    .on('set', function(value, callback) {
      device.setCapabilityValue('onoff', value)
      callback();
    })
    .on('get', returnCapabilityValue(device, 'onoff'));

  // FanSpeed
  if ('dim' in capabilities) {
    homekitAccessory
      .getService(Service.Fan)
      .addCharacteristic(Characteristic.RotationSpeed)
      .on('set', function(value, callback) {
        device.setCapabilityValue('dim', value / 100)
        callback();
      })
      .on('get', returnCapabilityValue(device, 'dim', v => v * 100));
  }

  // On realtime event update the device
  for (let i in device.capabilities) {
    if (['onoff','dim'].includes(device.capabilities[i].split('.')[0])) {
      console.log('created listener for - ' + device.capabilities[i]);
      let listener = async (value) => {
        onStateChange(device.capabilities[i], value, device);
      };

      device.makeCapabilityInstance(device.capabilities[i], listener);
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
