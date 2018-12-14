const Accessory = require('hap-nodejs').Accessory;
const Service = require('hap-nodejs').Service;
const Characteristic = require('hap-nodejs').Characteristic;
const uuid = require('hap-nodejs').uuid;
const debounce = require('lodash.debounce');

function state2value(state, targetStateValue) {
  if (state == 'partially_armed')
  {
	if (targetStateValue == 0){
	  return 0;	
	}
    else if (targetStateValue == 2){
	  return 2;	
	}
	else{
	  return 0
	}	
  }
  else if (state == 'armed')
  {
    return 1;
  }
  else if (state == 'disarmed')
  {
    return 3;
  }
  else
  {
    return 3;	
  }
}

function value2state(value) {
  if (value == 0)
  {
    return 'partially_armed'
  }
  else if (value == 1)
  {
    return 'armed';
  }
  else if (value == 2)
  {
    return 'partially_armed';
  }
  else if (value == 3)
  {
    return 'disarmed';
  }
  else
  {
    return 'disarmed';	
  }
}

module.exports = function(device, api) {

  let capabilities = Object.values(device.capabilities || {}).reduce((acc, val) => {
    acc[val.split('.')[0]] = true;
    return acc;
  }, {});
  
  // Var that keeps the target state
  var targetStateValue = null;
  
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
  // Current state
  homekitAccessory
    .addService(Service.SecuritySystem, device.name)
    .getCharacteristic(Characteristic.SecuritySystemCurrentState)
    .on('get', function(callback) {
      //support for Heimdall app alarm capability
	  if('alarm_heimdall' in device.capabilities && device.capabilitiesObj['alarm_heimdall'].value === true){
	    callback(null, 4);    
	  }
	  else{
	    callback(null, state2value(device.capabilitiesObj['homealarm_state'].value, targetStateValue));	
	  }     
    });

  // Target capabilitiesObj
  homekitAccessory
    .getService(Service.SecuritySystem)
    .getCharacteristic(Characteristic.SecuritySystemTargetState)
    .on('set', function(value, callback) {
	  targetStateValue = value;
      device.setCapabilityValue('homealarm_state', value2state(value) )
      callback();
    })
    .on('get', function(callback) {
      callback(null, state2value(device.capabilitiesObj['homealarm_state'].value, targetStateValue));
    });

  // Tamper
  if('alarm_tamper' in device.capabilities){
  homekitAccessory
    .getService(Service.SecuritySystem)
    .getCharacteristic(Characteristic.StatusTampered)
    .on('get', function(callback) {
      callback(null, ~~device.capabilitiesObj['alarm_tamper'].value);
    });
  }

  // On realtime event update the device
  device.on('$update', id => {

    console.log('Realtime update from: ' + device.name)

	//support for Heimdall app alarm capability
	if('alarm_heimdall' in device.capabilities && device.capabilitiesObj['alarm_heimdall'].value === true){
      homekitAccessory
        .getService(Service.SecuritySystem)
        .getCharacteristic(Characteristic.SecuritySystemCurrentState)
        .updateValue(4);
	}
	else
	{		
      homekitAccessory
	    .getService(Service.SecuritySystem)
	    .getCharacteristic(Characteristic.SecuritySystemTargetState)
	    .updateValue(state2value(device.capabilitiesObj['homealarm_state'].value, targetStateValue));
	
	  homekitAccessory
	    .getService(Service.SecuritySystem)
	    .getCharacteristic(Characteristic.SecuritySystemCurrentState)
	    .updateValue(state2value(device.capabilitiesObj['homealarm_state'].value, targetStateValue));
	}
	
    if('alarm_tamper' in device.capabilities){
      homekitAccessory
        .getService(Service.SecuritySystem)
        .getCharacteristic(Characteristic.StatusTampered)
        .updateValue(~~device.capabilitiesObj['alarm_tamper'].value);
    }

  });

  // Return device to app.js
  return homekitAccessory
}
