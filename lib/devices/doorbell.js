const Accessory = require('hap-nodejs').Accessory;
const Service = require('hap-nodejs').Service;
const Characteristic = require('hap-nodejs').Characteristic;
const uuid = require('hap-nodejs').uuid;
const debounce = require('lodash.debounce');

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
  // Motion
  homekitAccessory
    .addService(Service.MotionSensor, device.name)
    .getCharacteristic(Characteristic.MotionDetected)
    .on('get', function(callback) {
      callback(null, device.capabilitiesObj.alarm_generic.value);
    });

  // On realtime event update the device
  for (let i in device.capabilities) {
    if (['alarm_generic'].includes(device.capabilities[i].split('.')[0])) {
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
      .getService(Service.MotionSensor)
      .getCharacteristic(Characteristic.MotionDetected)
      .updateValue(~~value);
  }

  // Return device to app.js
  return homekitAccessory
}
