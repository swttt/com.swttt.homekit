const Accessory             = require('hap-nodejs').Accessory;
const Service               = require('hap-nodejs').Service;
const Characteristic        = require('hap-nodejs').Characteristic;
const CustomServices        = require('../custom-services');
const CustomCharacteristics = require('../custom-characteristics');
const uuid                  = require('hap-nodejs').uuid;
const debounce              = require('lodash.debounce');

module.exports = function(device, api, capabilities) {
  let stateKeys  = Object.keys(device.state);
  const capValue = key => device.state[stateKeys.filter(k => k.startsWith(key))[0]];

  // Init device
  var homekitAccessory = new Accessory(device.name, device.id);

  // Set device info
  homekitAccessory
    .getService(Service.AccessoryInformation)
    .setCharacteristic(Characteristic.Manufacturer, device.driver.owner_name)
    .setCharacteristic(Characteristic.Model, device.name + '(' + device.zone.name + ')')
    .setCharacteristic(Characteristic.SerialNumber, device.id);

  // Device identify when added
  homekitAccessory.on('identify', function(paired, callback) {
    console.log(device.name + ' identify');
    callback();
  });

  // Add services and characteristics

  // Light Sensor
  if ('measure_luminance' in capabilities) {
    homekitAccessory
      .addService(Service.LightSensor, device.name)
      .getCharacteristic(Characteristic.CurrentAmbientLightLevel)
      .on('get', function(callback) {
        callback(null, capValue('measure_luminance'));
      });
  }

  // Temperature Sensor
  if('measure_temperature' in capabilities){
	  homekitAccessory
	    .addService(Service.TemperatureSensor, device.name)
	    .getCharacteristic(Characteristic.CurrentTemperature)
      .setProps({
        minValue : -100,
        maxValue : 100
      })
	    .on('get', function(callback) {
	      callback(null, capValue('measure_temperature'));
	    });
  }

  // Humidity Sensor
  if('measure_humidity' in capabilities){
	  homekitAccessory
	    .addService(Service.HumiditySensor, device.name)
	    .getCharacteristic(Characteristic.CurrentRelativeHumidity)
	    .on('get', function(callback) {
	      callback(null, capValue('measure_humidity'));
	    });
  }

  // Air Pressure Sensor
  if ('measure_pressure' in capabilities) {
    homekitAccessory
      .addService(CustomServices.AirPressureSensor, device.name)
      .getCharacteristic(CustomCharacteristics.AirPressure)
      .on('get', function(callback) {
        callback(null, capValue('measure_pressure'));
      });
  }

  // Motion Sensor
  if('alarm_motion' in capabilities){
	  homekitAccessory
	    .addService(Service.MotionSensor, device.name)
	    .getCharacteristic(Characteristic.MotionDetected)
	    .on('get', function(callback) {
	      callback(null, ~~capValue('alarm_motion'));
	    });
  }

  // Leak Sensor
  if('alarm_water' in capabilities){
  	  homekitAccessory
	    .addService(Service.LeakSensor, device.name)
	    .getCharacteristic(Characteristic.LeakDetected)
	    .on('get', function(callback) {
	      callback(null, ~~capValue('alarm_water'));
	    });
  }

  // Contact Sensor
  if('alarm_contact' in capabilities){
  	  homekitAccessory
	    .addService(Service.ContactSensor, device.name)
	    .getCharacteristic(Characteristic.ContactSensorState)
	    .on('get', function(callback) {
	      callback(null, ~~capValue('alarm_contact'));
	    });
  }
  
  // Smoke Sensor
  if('alarm_smoke' in capabilities){
	  // Smoke Detected
	  homekitAccessory
	    .addService(Service.SmokeSensor, device.name)
	    .getCharacteristic(Characteristic.SmokeDetected)
	    .on('get', function(callback) {
	      callback(null, ~~capValue('alarm_smoke'));
	    });
  }

  // CarbonMonoxide Sensor
  if('alarm_co' in capabilities){
	  // CarbonMonoxideDetected
	  homekitAccessory
	    .addService(Service.CarbonMonoxideSensor, device.name)
	    .getCharacteristic(Characteristic.CarbonMonoxideDetected)
	    .on('get', function(callback) {
	      callback(null, ~~capValue('alarm_co'));
	    });

	  // CarbonMonoxideLevel
	  if('measure_co' in capabilities){
	  homekitAccessory
	    .getService(Service.CarbonMonoxideSensor)
	    .getCharacteristic(Characteristic.CarbonMonoxideLevel)
	    .on('get', function(callback) {
	      callback(null, capValue('measure_co'));
	    });
	  }
  }

  // CarbonDioxide Sensor
  if('alarm_co2' in capabilities){
	  // CarbonDioxideDetected
	  homekitAccessory
	    .addService(Service.CarbonDioxideSensor, device.name)
	    .getCharacteristic(Characteristic.CarbonDioxideDetected)
	    .on('get', function(callback) {
	      callback(null, ~~capValue('alarm_co2'));
	    });
	
	  // CarbonDioxideLevel
	  if('measure_co2' in capabilities){
	  homekitAccessory
	    .getService(Service.CarbonDioxideSensor)
	    .getCharacteristic(Characteristic.CarbonDioxideLevel)
	    .on('get', function(callback) {
	      callback(null, capValue('measure_co2'));
	    });
	  }
  }

  // On realtime event update the device
  device.on('$state', debounce(state => {
    let stateKeys  = Object.keys(state);
    const capValue = key => state[stateKeys.filter(k => k.startsWith(key))[0]];

    console.log('Realtime update from:', device.name, ', state =', device.state);

    // Light Sensor
    if ('measure_luminance' in capabilities){
      homekitAccessory
      .getService(Service.LightSensor)
      .getCharacteristic(Characteristic.CurrentAmbientLightLevel)
      .updateValue(capValue('measure_luminance'));
    }

    // Temperature Sensor
    if('measure_temperature' in capabilities){
      homekitAccessory
      .getService(Service.TemperatureSensor)
      .getCharacteristic(Characteristic.CurrentTemperature)
      .updateValue(capValue('measure_temperature'));
    }
    
    // Humidity Sensor
    if('measure_humidity' in capabilities){
      homekitAccessory
          .getService(Service.HumiditySensor)
          .getCharacteristic(Characteristic.CurrentRelativeHumidity)
          .updateValue(capValue('measure_humidity'));
      }

    // Air Pressure Sensor
    if ('measure_pressure' in capabilities) {
      homekitAccessory
      .getService(CustomServices.AirPressureSensor)
      .getCharacteristic(CustomCharacteristics.AirPressure)
      .updateValue(capValue('measure_pressure'));
    }

    // Motion Sensor
    if('alarm_motion' in capabilities){
      homekitAccessory
      .getService(Service.MotionSensor)
      .getCharacteristic(Characteristic.MotionDetected)
      .updateValue(~~capValue('alarm_motion'));
    }

    // Leak Sensor
      if('alarm_water' in capabilities){
        homekitAccessory
          .getService(Service.LeakSensor)
          .getCharacteristic(Characteristic.LeakDetected)
          .updateValue(~~capValue('alarm_water'));
      }

    // Contact Sensor
      if('alarm_contact' in capabilities){
        homekitAccessory
          .getService(Service.ContactSensor)
          .getCharacteristic(Characteristic.ContactSensorState)
          .updateValue(~~capValue('alarm_contact'));
      }

    // Smoke Sensor
    if('alarm_smoke' in capabilities){
        homekitAccessory
        .getService(Service.SmokeSensor)
        .getCharacteristic(Characteristic.SmokeDetected)
        .updateValue(~~capValue('alarm_smoke'));
    }
    
    // Carbonmonoxide Sensor
    if('alarm_co' in capabilities){
      homekitAccessory
          .getService(Service.CarbonMonoxideSensor)
          .getCharacteristic(Characteristic.CarbonMonoxideDetected)
          .updateValue(~~capValue('alarm_co'));

      if('measure_co' in capabilities){
          homekitAccessory
            .getService(Service.CarbonMonoxideSensor)
            .getCharacteristic(Characteristic.CarbonMonoxideLevel)
            .updateValue(capValue('measure_co'));
        }
      }

    // Carbondioxide Sensor
    if('alarm_co2' in capabilities){
        homekitAccessory
          .getService(Service.CarbonDioxideSensor)
          .getCharacteristic(Characteristic.CarbonDioxideDetected)
          .updateValue(~~capValue('alarm_co2'));

      if('measure_co2' in capabilities){
          homekitAccessory
            .getService(Service.CarbonDioxideSensor)
            .getCharacteristic(Characteristic.CarbonDioxideLevel)
            .updateValue(capValue('measure_co2'));
        }
      }

  }));

  // Return device to app.js
  return homekitAccessory
}
