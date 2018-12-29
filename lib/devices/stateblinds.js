const Accessory = require('hap-nodejs').Accessory;
const Service = require('hap-nodejs').Service;
const Characteristic = require('hap-nodejs').Characteristic;
const uuid = require('hap-nodejs').uuid;
const debounce = require('lodash.debounce');

function state2value(state)
{
  if (state == 'down')
  {
    return 0;
  }
  else if (state == 'up')
  {
    return 100;
  }
  else
  {
    return 50;
  }
}

function value2state(value)
{
  if (value == 100)
  {
    return 'up';
  }
  else if (value == 0)
  {
    return 'down';
  }
  else
  {
    return 'idle';
  }
}

function state2num(state)
{
  if (state == 'up')
  {
    return 1;
  }
  else if (state == 'down')
  {
    return 0;
  }
  else
  {
    return 2;
  }
}

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
    .on('get', function(callback) {
      callback(null, state2value(device.capabilitiesObj.windowcoverings_state.value));
    });

  // Set steps for position
  homekitAccessory
    .getService(Service.WindowCovering)
    .getCharacteristic(Characteristic.TargetPosition)
    .setProps({
      minStep: 50
    });

  // Targetposition
  homekitAccessory
    .getService(Service.WindowCovering)
    .getCharacteristic(Characteristic.TargetPosition)
    .on('set', function(value, callback) {
      device.setCapabilityValue('windowcoverings_state', value2state(value));
      callback();
    })
    .on('get', function(callback) {
      callback(null, state2value(device.capabilitiesObj.windowcoverings_state.value));
    });

  // PositionState
  homekitAccessory
    .getService(Service.WindowCovering)
    .getCharacteristic(Characteristic.PositionState)
    .on('get', function(callback) {
      callback(null, state2num(device.capabilitiesObj.windowcoverings_state.value));
    });

  // On realtime event update the device
  for (let i in device.capabilities) {
	let listener = async (value) => {
	  onStateChange(device.capabilities[i], value, device);
    };

  	device.makeCapabilityInstance(device.capabilities[i], listener);
  }
  
  async function onStateChange(capability, value, device) {

    console.log('State Change - ' + device.name + ' - ' + capability + ' - ' + value);

    homekitAccessory
      .getService(Service.WindowCovering)
      .getCharacteristic(Characteristic.CurrentPosition)
      .updateValue(state2value(device.capabilitiesObj.windowcoverings_state.value));

    homekitAccessory
      .getService(Service.WindowCovering)
      .getCharacteristic(Characteristic.PositionState)
      .updateValue(state2num(device.capabilitiesObj.windowcoverings_state.value)); 
  }
  
  // Return device to app.js
  return homekitAccessory
}