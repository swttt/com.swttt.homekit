const { Accessory, Service, Characteristic }                = require('../../modules/hap-nodejs');
const debounce                                              = require('lodash.debounce');
const { returnCapabilityValue, setupAccessoryInformations } = require('./utils');

function state2value(state) {
  if (state === 'down') {
    return 0;
  } else if (state === 'up') {
    return 100;
  } else {
    return 50;
  }
}

function value2state(value) {
  if (value === 100) {
    return 'up';
  } else if (value === 0) {
    return 'down';
  } else {
    return 'idle';
  }
}

function state2num(state) {
  if (state === 'up') {
    return 1;
  } else if (state === 'down') {
    return 0;
  } else {
    return 2;
  }
}

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
    .on('get', returnCapabilityValue(device, 'windowcoverings_state', state2value));

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
      device.setCapabilityValue('windowcoverings_state', value2state(value)).catch(() => {});;
      callback();
    })
    .on('get', returnCapabilityValue(device, 'windowcoverings_state', state2value));

  // PositionState
  homekitAccessory
    .getService(Service.WindowCovering)
    .getCharacteristic(Characteristic.PositionState)
    .on('get', returnCapabilityValue(device, 'windowcoverings_state', state2num));

  // On realtime event update the device
  for (let i in device.capabilities) {
    if (device.capabilities[i] && ['windowcoverings_state'].includes(device.capabilities[i].split('.')[0])) {
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

    windowcovering.getCharacteristic(Characteristic.TargetPosition)
      .updateValue(state2value(value));

    windowcovering.getCharacteristic(Characteristic.CurrentPosition)
      .updateValue(state2value(value));

    windowcovering.getCharacteristic(Characteristic.PositionState)
      .updateValue(state2num(value));
  }

  // Return device to app.js
  return homekitAccessory;
}
