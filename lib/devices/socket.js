const Accessory = require('hap-nodejs').Accessory;
const Service = require('hap-nodejs').Service;
const Characteristic = require('hap-nodejs').Characteristic;
const uuid = require('hap-nodejs').uuid;
const debounce = require('lodash.debounce');

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

  // Create a new outlet service.
  const outlet = homekitAccessory.addService(Service.Outlet, device.name);

  // Dimmable socket?
  if ('dim' in capabilities) {
    outlet.addCharacteristic(Characteristic.Brightness);
  }

  // Add services and characteristics
  // Onoff
  outlet  .getCharacteristic(Characteristic.On)
          .on('set', function(value, callback) {
            device.setCapabilityValue('onoff', value)
            callback();
          })
          .on('get', function(callback) {
            callback(null, device.capabilitiesObj.onoff.value);
          });

  // OutletInUse
  outlet  .getCharacteristic(Characteristic.OutletInUse)
          .on('get', function(callback) {
            callback(null, true);
          });

  // Brightness
  if ('dim' in capabilities) {
    outlet  .getCharacteristic(Characteristic.Brightness)
            .on('set', function(value, callback) {
              device.setCapabilityValue('dim', value / 100)
              callback();
            })
            .on('get', function(callback) {
              callback(null, device.capabilitiesObj.dim.value * 100);
            });
  }

  // On realtime event update the device
  for (let i in device.capabilities) {
    let listener = async (value) => {
      onStateChange(device.capabilities[i], value, device);
    };

	device.makeCapabilityInstance(device.capabilities[i], listener);
  }
  
  async function onStateChange(capability, value, device) {

    console.log('State Change - ' + device.name + ' - ' + capability + ' - ' + value);

	const outlet = homekitAccessory.getService(Service.Outlet)

	outlet.getCharacteristic(Characteristic.On)
      .updateValue(device.capabilitiesObj.onoff.value);
	  
	if ('dim' in capabilities) {
  		outlet.getCharacteristic(Characteristic.Brightness).updateValue(device.capabilitiesObj.dim.value * 100);
	} 
  }

  // Return device to app.js
  return homekitAccessory
}
