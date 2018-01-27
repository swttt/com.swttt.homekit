const Accessory = require('hap-nodejs').Accessory;
const Service = require('hap-nodejs').Service;
const Characteristic = require('hap-nodejs').Characteristic;
const uuid = require('hap-nodejs').uuid;
const _ = require('lodash');

module.exports = function(device, api) {

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
  if ('measure_luminance' in device.capabilities) {
    homekitAccessory
      .addService(Service.LightSensor, device.name)
      .getCharacteristic(Characteristic.CurrentAmbientLightLevel)
      .on('get', function(callback) {
        callback(null, device.state.measure_luminance);
      });

      // Tamper
	  if('alarm_tamper' in device.capabilities){
	  homekitAccessory
	    .getService(Service.LightSensor)
	    .getCharacteristic(Characteristic.StatusTampered)
	    .on('get', function(callback) {
	      callback(null, ~~device.state.alarm_tamper);
	    });
	  }

	  // Battery
	  if('alarm_battery' in device.capabilities){
	  homekitAccessory
	    .getService(Service.LightSensor)
	    .getCharacteristic(Characteristic.StatusLowBattery)
	    .on('get', function(callback) {
	      callback(null, ~~device.state.alarm_battery);
	    });
	  }
  }

  // Temperature Sensor
  if('measure_temperature' in device.capabilities){
	  // Current Temperature
	  homekitAccessory
	    .addService(Service.TemperatureSensor, device.name)
	    .getCharacteristic(Characteristic.CurrentTemperature)
	    .on('get', function(callback) {
	      callback(null, device.state.measure_temperature);
	    });

	  // Tamper
	  if('alarm_tamper' in device.capabilities){
	  homekitAccessory
	    .getService(Service.TemperatureSensor)
	    .getCharacteristic(Characteristic.StatusTampered)
	    .on('get', function(callback) {
	      callback(null, ~~device.state.alarm_tamper);
	    });
	  }

	  // Battery
	  if('alarm_battery' in device.capabilities){
	  homekitAccessory
	    .getService(Service.TemperatureSensor)
	    .getCharacteristic(Characteristic.StatusLowBattery)
	    .on('get', function(callback) {
	      callback(null, ~~device.state.alarm_battery);
	    });
	  }
  }

  // Humidity Sensor
  if('measure_humidity' in device.capabilities){
	  // Current Humidity
	  homekitAccessory
	    .addService(Service.HumiditySensor, device.name)
	    .getCharacteristic(Characteristic.CurrentRelativeHumidity)
	    .on('get', function(callback) {
	      callback(null, device.state.measure_humidity);
	    });

	  // Tamper
	  if('alarm_tamper' in device.capabilities){
	  homekitAccessory
	    .getService(Service.HumiditySensor)
	    .getCharacteristic(Characteristic.StatusTampered)
	    .on('get', function(callback) {
	      callback(null, ~~device.state.alarm_tamper);
	    });
	  }

	  // Battery
	  if('alarm_battery' in device.capabilities){
	  homekitAccessory
	    .getService(Service.HumiditySensor)
	    .getCharacteristic(Characteristic.StatusLowBattery)
	    .on('get', function(callback) {
	      callback(null, ~~device.state.alarm_battery);
	    });
	  }
  }

  // Motion Sensor
  if('alarm_motion' in device.capabilities){
	  homekitAccessory
	    .addService(Service.MotionSensor, device.name)
	    .getCharacteristic(Characteristic.MotionDetected)
	    .on('get', function(callback) {
	      callback(null, ~~device.state.alarm_motion);
	    });

	  // Tamper
	  if('alarm_tamper' in device.capabilities){
	  homekitAccessory
	    .getService(Service.MotionSensor)
	    .getCharacteristic(Characteristic.StatusTampered)
	    .on('get', function(callback) {
	      callback(null, ~~device.state.alarm_tamper);
	    });
	  }

	  // Battery
	  if('alarm_battery' in device.capabilities){
	  homekitAccessory
	    .getService(Service.MotionSensor)
	    .getCharacteristic(Characteristic.StatusLowBattery)
	    .on('get', function(callback) {
	      callback(null, ~~device.state.alarm_battery);
	    });
	  }
  }

  // Leak Sensor
  if('alarm_water' in device.capabilities){
  	  homekitAccessory
	    .addService(Service.LeakSensor, device.name)
	    .getCharacteristic(Characteristic.LeakDetected)
	    .on('get', function(callback) {
	      callback(null, ~~device.state.alarm_water);
	    });

	  // Tamper
	  if('alarm_tamper' in device.capabilities){
	  homekitAccessory
	    .getService(Service.LeakSensor)
	    .getCharacteristic(Characteristic.StatusTampered)
	    .on('get', function(callback) {
	      callback(null, ~~device.state.alarm_tamper);
	    });
	  }

	  // Battery
	  if('alarm_battery' in device.capabilities){
	  homekitAccessory
	    .getService(Service.LeakSensor)
	    .getCharacteristic(Characteristic.StatusLowBattery)
	    .on('get', function(callback) {
	      callback(null, ~~device.state.alarm_battery);
	    });
	  }
  }

  // Contact Sensor
  if('alarm_contact' in device.capabilities){
  	  homekitAccessory
	    .addService(Service.ContactSensor, device.name)
	    .getCharacteristic(Characteristic.ContactSensorState)
	    .on('get', function(callback) {
	      callback(null, ~~device.state.alarm_contact);
	    });

	  // Tamper
	  if('alarm_tamper' in device.capabilities){
	  homekitAccessory
	    .getService(Service.ContactSensor)
	    .getCharacteristic(Characteristic.StatusTampered)
	    .on('get', function(callback) {
	      callback(null, ~~device.state.alarm_tamper);
	    });
	  }

	  // Battery
	  if('alarm_battery' in device.capabilities){
	  homekitAccessory
	    .getService(Service.ContactSensor)
	    .getCharacteristic(Characteristic.StatusLowBattery)
	    .on('get', function(callback) {
	      callback(null, ~~device.state.alarm_battery);
	    });
	  }
  }
  
  // Smoke Sensor
  if('alarm_smoke' in device.capabilities){
	  // Smoke Detected
	  homekitAccessory
	    .addService(Service.SmokeSensor, device.name)
	    .getCharacteristic(Characteristic.SmokeDetected)
	    .on('get', function(callback) {
	      callback(null, ~~device.state.alarm_smoke);
	    });

	  // Tamper
	  if('alarm_tamper' in device.capabilities){
	  homekitAccessory
	    .getService(Service.SmokeSensor)
	    .getCharacteristic(Characteristic.StatusTampered)
	    .on('get', function(callback) {
	      callback(null, ~~device.state.alarm_tamper);
	    });
	  }

	  // Battery
	  if('alarm_battery' in device.capabilities){
	  homekitAccessory
	    .getService(Service.SmokeSensor)
	    .getCharacteristic(Characteristic.StatusLowBattery)
	    .on('get', function(callback) {
	      callback(null, ~~device.state.alarm_battery);
	    });
	  }
  }

  // CarbonMonoxide Sensor
  if('alarm_co' in device.capabilities){
	  // CarbonMonoxideDetected
	  homekitAccessory
	    .addService(Service.CarbonMonoxideSensor, device.name)
	    .getCharacteristic(Characteristic.CarbonMonoxideDetected)
	    .on('get', function(callback) {
	      callback(null, ~~device.state.alarm_co);
	    });

	  // Tamper
	  if('alarm_tamper' in device.capabilities){
	  homekitAccessory
	    .getService(Service.CarbonMonoxideSensor)
	    .getCharacteristic(Characteristic.StatusTampered)
	    .on('get', function(callback) {
	      callback(null, ~~device.state.alarm_tamper);
	    });
	  }

	  // Battery
	  if('alarm_battery' in device.capabilities){
	  homekitAccessory
	    .getService(Service.CarbonMonoxideSensor)
	    .getCharacteristic(Characteristic.StatusLowBattery)
	    .on('get', function(callback) {
	      callback(null, ~~device.state.alarm_battery);
	    });
	  }

	  // CarbonMonoxideLevel
	  if('measure_co' in device.capabilities){
	  homekitAccessory
	    .getService(Service.CarbonMonoxideSensor)
	    .getCharacteristic(Characteristic.CarbonMonoxideLevel)
	    .on('get', function(callback) {
	      callback(null, device.state.measure_co);
	    });
	  }
  }

  // CarbonDioxide Sensor
  if('alarm_co2' in device.capabilities){
	  // CarbonDioxideDetected
	  homekitAccessory
	    .addService(Service.CarbonDioxideSensor, device.name)
	    .getCharacteristic(Characteristic.CarbonDioxideDetected)
	    .on('get', function(callback) {
	      callback(null, ~~device.state.alarm_co2);
	    });

	  // Tamper
	  if('alarm_tamper' in device.capabilities){
	  homekitAccessory
	    .getService(Service.CarbonDioxideSensor)
	    .getCharacteristic(Characteristic.StatusTampered)
	    .on('get', function(callback) {
	      callback(null, ~~device.state.alarm_tamper);
	    });
	  }

	  // Battery
	  if('alarm_battery' in device.capabilities){
	  homekitAccessory
	    .getService(Service.CarbonDioxideSensor)
	    .getCharacteristic(Characteristic.StatusLowBattery)
	    .on('get', function(callback) {
	      callback(null, ~~device.state.alarm_battery);
	    });
	  }

	  // CarbonDioxideLevel
	  if('measure_co2' in device.capabilities){
	  homekitAccessory
	    .getService(Service.CarbonDioxideSensor)
	    .getCharacteristic(Characteristic.CarbonDioxideLevel)
	    .on('get', function(callback) {
	      callback(null, device.state.measure_co2);
	    });
	  }
  }

  // On realtime event update the device
  device.on('$state', _.debounce(state => {

    console.log('Realtime update from: ' + device.name)

	// Light Sensor
	if('measure_luminance' in device.capabilities){
	    homekitAccessory
		  .getService(Service.LightSensor)
		  .getCharacteristic(Characteristic.CurrentAmbientLightLevel)
		  .updateValue(state.measure_luminance);

	    if('alarm_tamper' in device.capabilities){
	      homekitAccessory
	        .getService(Service.LightSensor)
	        .getCharacteristic(Characteristic.StatusTampered)
	        .updateValue(~~state.alarm_tamper);
	    }

	    if('alarm_battery' in device.capabilities){
	      homekitAccessory
	        .getService(Service.LightSensor)
	        .getCharacteristic(Characteristic.StatusLowBattery)
	        .updateValue(~~state.alarm_battery);
	    }
	}

	// Temperature Sensor
	if('measure_temperature' in device.capabilities){
	    homekitAccessory
		  .getService(Service.TemperatureSensor)
		  .getCharacteristic(Characteristic.CurrentTemperature)
		  .updateValue(state.measure_temperature);

	    if('alarm_tamper' in device.capabilities){
	      homekitAccessory
	        .getService(Service.TemperatureSensor)
	        .getCharacteristic(Characteristic.StatusTampered)
	        .updateValue(~~state.alarm_tamper);
	    }

	    if('alarm_battery' in device.capabilities){
	      homekitAccessory
	        .getService(Service.TemperatureSensor)
	        .getCharacteristic(Characteristic.StatusLowBattery)
	        .updateValue(~~state.alarm_battery);
	    }
	}
	
	// Humidity Sensor
	if('measure_humidity' in device.capabilities){
		homekitAccessory
	      .getService(Service.HumiditySensor)
	      .getCharacteristic(Characteristic.CurrentRelativeHumidity)
	      .updateValue(state.measure_humidity);

	    if('alarm_tamper' in device.capabilities){
	      homekitAccessory
	        .getService(Service.HumiditySensor)
	        .getCharacteristic(Characteristic.StatusTampered)
	        .updateValue(~~state.alarm_tamper);
	    }

	    if('alarm_battery' in device.capabilities){
	      homekitAccessory
	        .getService(Service.HumiditySensor)
	        .getCharacteristic(Characteristic.StatusLowBattery)
	        .updateValue(~~state.alarm_battery);
	    }
    }

	// Motion Sensor
	if('alarm_motion' in device.capabilities){
		homekitAccessory
		.getService(Service.MotionSensor)
		.getCharacteristic(Characteristic.MotionDetected)
		.updateValue(~~state.alarm_motion);

		if('alarm_tamper' in device.capabilities){
			homekitAccessory
			.getService(Service.MotionSensor)
			.getCharacteristic(Characteristic.StatusTampered)
			.updateValue(~~state.alarm_tamper);
		}

		if('alarm_battery' in device.capabilities){
			homekitAccessory
			.getService(Service.MotionSensor)
			.getCharacteristic(Characteristic.StatusLowBattery)
			.updateValue(~~state.alarm_battery);
		}
	}

	// Leak Sensor
    if('alarm_water' in device.capabilities){
    	homekitAccessory
	      .getService(Service.LeakSensor)
	      .getCharacteristic(Characteristic.LeakDetected)
	      .updateValue(~~state.alarm_water);

	    if('alarm_tamper' in device.capabilities){
	      homekitAccessory
	        .getService(Service.LeakSensor)
	        .getCharacteristic(Characteristic.StatusTampered)
	        .updateValue(~~state.alarm_tamper);
	    }

	    if('alarm_battery' in device.capabilities){
	      homekitAccessory
	        .getService(Service.LeakSensor)
	        .getCharacteristic(Characteristic.StatusLowBattery)
	        .updateValue(~~state.alarm_battery);
	    }
    }

	// Contact Sensor
    if('alarm_contact' in device.capabilities){
    	homekitAccessory
	      .getService(Service.ContactSensor)
	      .getCharacteristic(Characteristic.ContactSensorState)
	      .updateValue(~~state.alarm_contact);

	    if('alarm_tamper' in device.capabilities){
	      homekitAccessory
	        .getService(Service.ContactSensor)
	        .getCharacteristic(Characteristic.StatusTampered)
	        .updateValue(~~state.alarm_tamper);
	    }

	    if('alarm_battery' in device.capabilities){
	      homekitAccessory
	        .getService(Service.ContactSensor)
	        .getCharacteristic(Characteristic.StatusLowBattery)
	        .updateValue(~~state.alarm_battery);
	    }
    }

	// Smoke Sensor
	if('alarm_smoke' in device.capabilities){
	    homekitAccessory
		  .getService(Service.SmokeSensor)
		  .getCharacteristic(Characteristic.SmokeDetected)
		  .updateValue(~~state.alarm_smoke);

	    if('alarm_tamper' in device.capabilities){
	      homekitAccessory
	        .getService(Service.SmokeSensor)
	        .getCharacteristic(Characteristic.StatusTampered)
	        .updateValue(~~state.alarm_tamper);
	    }

	    if('alarm_battery' in device.capabilities){
	      homekitAccessory
	        .getService(Service.SmokeSensor)
	        .getCharacteristic(Characteristic.StatusLowBattery)
	        .updateValue(~~state.alarm_battery);
	    }
	}
	
	// Carbonmonoxide Sensor
	if('alarm_co' in device.capabilities){
		homekitAccessory
	      .getService(Service.CarbonMonoxideSensor)
	      .getCharacteristic(Characteristic.CarbonMonoxideDetected)
	      .updateValue(~~state.alarm_co);

	    if('alarm_tamper' in device.capabilities){
	      homekitAccessory
	        .getService(Service.CarbonMonoxideSensor)
	        .getCharacteristic(Characteristic.StatusTampered)
	        .updateValue(~~state.alarm_tamper);
	    }

	    if('alarm_battery' in device.capabilities){
	      homekitAccessory
	        .getService(Service.CarbonMonoxideSensor)
	        .getCharacteristic(Characteristic.StatusLowBattery)
	        .updateValue(~~state.alarm_battery);
	    }

		if('measure_co' in device.capabilities){
	      homekitAccessory
	        .getService(Service.CarbonMonoxideSensor)
	        .getCharacteristic(Characteristic.CarbonMonoxideLevel)
	        .updateValue(state.measure_co);
	    }
    }

	// Carbondioxide Sensor
	if('alarm_co2' in device.capabilities){
	    homekitAccessory
	      .getService(Service.CarbonDioxideSensor)
	      .getCharacteristic(Characteristic.CarbonDioxideDetected)
	      .updateValue(~~state.alarm_co2);

	    if('alarm_tamper' in device.capabilities){
	      homekitAccessory
	        .getService(Service.CarbonDioxideSensor)
	        .getCharacteristic(Characteristic.StatusTampered)
	        .updateValue(~~state.alarm_tamper);
	    }

	    if('alarm_battery' in device.capabilities){
	      homekitAccessory
	        .getService(Service.CarbonDioxideSensor)
	        .getCharacteristic(Characteristic.StatusLowBattery)
	        .updateValue(~~state.alarm_battery);
	    }

		if('measure_co2' in device.capabilities){
	      homekitAccessory
	        .getService(Service.CarbonDioxideSensor)
	        .getCharacteristic(Characteristic.CarbonDioxideLevel)
	        .updateValue(state.measure_co2);
	    }
    }

  }));

  // Return device to app.js
  return homekitAccessory
}
