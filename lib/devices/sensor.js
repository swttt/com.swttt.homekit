const Accessory                 = require('hap-nodejs').Accessory;
const Service                   = require('hap-nodejs').Service;
const Characteristic            = require('hap-nodejs').Characteristic;
const uuid                      = require('hap-nodejs').uuid;
const debounce                  = require('lodash.debounce');
const {
  returnCapabilityValue,
  setupAccessoryInformations
}                               = require('./utils');

module.exports = function(device, api, capabilities) {
  let stateKeys  = Object.keys(device.capabilitiesObj);
  const capValue = key => device.capabilitiesObj[stateKeys.filter(k => k.startsWith(key))[0]].value;
  const dimmable = 'dim' in capabilities;

  // Init device
  const homekitAccessory = new Accessory(device.name || 'Sensor', device.id);

  // Set device info
  setupAccessoryInformations(homekitAccessory, device);

  // Device identify when added
  homekitAccessory.on('identify', function(paired, callback) {
    console.log(device.name + ' identify');
    callback();
  });

  // Add services and characteristics

  // Outlet- or Lightbulb-types.
  if ('onoff' in capabilities) {
    const service = homekitAccessory.addService(Service[ dimmable ? 'Lightbulb' : 'Outlet' ], device.name);

    service
      .getCharacteristic(Characteristic.On)
      .on('set', function(value, callback) {
        device.setCapabilityValue('onoff', value).catch(() => {});
        callback();
      })
      .on('get', returnCapabilityValue(device, 'onoff'));

    if (dimmable) {
      service
        .getCharacteristic(Characteristic.Brightness)
        .on('set', debounce(function(value, callback) {
          device.setCapabilityValue('dim', value / 100).catch(() => {});
          callback();
        }, 500))
        .on('get', returnCapabilityValue(device, 'dim', v => v * 100));
    }
  }

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
  if ('measure_temperature' in capabilities) {
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
  if ('measure_humidity' in capabilities) {
    homekitAccessory
      .addService(Service.HumiditySensor, device.name)
      .getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .on('get', function(callback) {
        callback(null, capValue('measure_humidity'));
      });
  }

  // Motion Sensor
  if ('alarm_motion' in capabilities) {
    homekitAccessory
      .addService(Service.MotionSensor, device.name)
      .getCharacteristic(Characteristic.MotionDetected)
      .on('get', function(callback) {
        callback(null, ~~capValue('alarm_motion'));
      });
  }

  // Leak Sensor
  if ('alarm_water' in capabilities) {
      homekitAccessory
      .addService(Service.LeakSensor, device.name)
      .getCharacteristic(Characteristic.LeakDetected)
      .on('get', function(callback) {
        callback(null, ~~capValue('alarm_water'));
      });
  }

  // Contact Sensor
  if ('alarm_contact' in capabilities) {
      homekitAccessory
      .addService(Service.ContactSensor, device.name)
      .getCharacteristic(Characteristic.ContactSensorState)
      .on('get', function(callback) {
        callback(null, ~~capValue('alarm_contact'));
      });
  }

  // Smoke Sensor
  if ('alarm_smoke' in capabilities) {
    // Smoke Detected
    homekitAccessory
      .addService(Service.SmokeSensor, device.name)
      .getCharacteristic(Characteristic.SmokeDetected)
      .on('get', function(callback) {
        callback(null, ~~capValue('alarm_smoke'));
      });
  }

  // CarbonMonoxide Sensor
  if ('measure_co' in capabilities || 'alarm_co' in capabilities) {
    var coService = homekitAccessory
      .addService(Service.CarbonMonoxideSensor, device.name);

      if ('measure_co' in capabilities) {
        coService.getCharacteristic(Characteristic.CarbonMonoxideLevel)
          .on('get', function(callback) {
            callback(null, capValue('measure_co'));
          });
      }

      if ('alarm_co' in capabilities) {
        coService.getCharacteristic(Characteristic.CarbonMonoxideDetected)
          .on('get', function(callback) {
            callback(null, ~~capValue('alarm_co'));
          });
      }
  }

  // CarbonDioxide Sensor
  if ('measure_co2' in capabilities || 'alarm_co2' in capabilities) {
    var co2service = homekitAccessory
      .addService(Service.CarbonDioxideSensor, device.name);

      if ('measure_co2' in capabilities) {
        co2service.getCharacteristic(Characteristic.CarbonDioxideLevel)
          .on('get', function(callback) {
            callback(null, capValue('measure_co2'));
          });
      }

      if ('alarm_co2' in capabilities) {
        co2service.getCharacteristic(Characteristic.CarbonDioxideDetected)
          .on('get', function(callback) {
            callback(null, ~~capValue('alarm_co2'));
          });
      }
  }

  // On realtime event update the device
  for (let i in device.capabilities) {
    if (device.capabilities[i] && ['measure_luminance','measure_temperature','measure_humidity','measure_pressure','alarm_motion','alarm_water','alarm_contact','alarm_smoke','alarm_co','measure_co','alarm_co2','measure_co2'].includes(device.capabilities[i].split('.')[0])) {
      console.log('created listener for - ' + device.capabilities[i]);
      let listener = async (value) => {
        onStateChange(device.capabilities[i], value, device);
      };

      try { device.makeCapabilityInstance(device.capabilities[i], listener) } catch(e) {};
    }
  }

  async function onStateChange(capability, value, device) {
    console.log('State Change - ' + device.name + ' - ' + capability + ' - ' + value);
    if (! device.capabilitiesObj) return;

    let stateKeys  = Object.keys(device.capabilitiesObj);
    const capValue = key => device.capabilitiesObj[stateKeys.filter(k => k.startsWith(key))[0]].value;

    switch(capability) {
      case 'onoff':
        homekitAccessory
          .getService(Service[ dimmable ? 'Lightbulb' : 'Outlet'])
          .getCharacteristic(Characteristic.On)
          .updateValue(value);
        break;
      case 'dim':
        homekitAccessory
          .getService(Service.Lightbulb)
          .getCharacteristic(Characteristic.Brightness)
          .updateValue(value * 100);
        break;
      case 'measure_luminance': // Light Sensor
        homekitAccessory
          .getService(Service.LightSensor)
          .getCharacteristic(Characteristic.CurrentAmbientLightLevel)
          .updateValue(capValue('measure_luminance'));
        break;
      case 'measure_temperature': // Temperature Sensor
        homekitAccessory
          .getService(Service.TemperatureSensor)
          .getCharacteristic(Characteristic.CurrentTemperature)
          .updateValue(capValue('measure_temperature'));
        break;
      case 'measure_humidity': // Humidity Sensor
        homekitAccessory
          .getService(Service.HumiditySensor)
          .getCharacteristic(Characteristic.CurrentRelativeHumidity)
          .updateValue(capValue('measure_humidity'));
        break;
      case 'alarm_motion': // Motion Sensor
        homekitAccessory
          .getService(Service.MotionSensor)
          .getCharacteristic(Characteristic.MotionDetected)
          .updateValue(~~capValue('alarm_motion'));
        break;
      case 'alarm_water': // Leak Sensor
        homekitAccessory
          .getService(Service.LeakSensor)
          .getCharacteristic(Characteristic.LeakDetected)
          .updateValue(~~capValue('alarm_water'));
        break;
      case 'alarm_contact': // Contact Sensor
        homekitAccessory
          .getService(Service.ContactSensor)
          .getCharacteristic(Characteristic.ContactSensorState)
          .updateValue(~~capValue('alarm_contact'));
        break;
      case 'alarm_smoke': // Smoke Sensor
        homekitAccessory
          .getService(Service.SmokeSensor)
          .getCharacteristic(Characteristic.SmokeDetected)
          .updateValue(~~capValue('alarm_smoke'));
        break;
      case 'alarm_co': // Carbonmonoxide Sensor
        homekitAccessory
          .getService(Service.CarbonMonoxideSensor)
          .getCharacteristic(Characteristic.CarbonMonoxideDetected)
          .updateValue(~~capValue('alarm_co'));
        break;
      case 'measure_co':
        homekitAccessory
          .getService(Service.CarbonMonoxideSensor)
          .getCharacteristic(Characteristic.CarbonMonoxideLevel)
          .updateValue(capValue('measure_co'));
        break;
      case 'alarm_co2': // Carbondioxide Sensor
        homekitAccessory
          .getService(Service.CarbonDioxideSensor)
          .getCharacteristic(Characteristic.CarbonDioxideDetected)
          .updateValue(~~capValue('alarm_co2'));
        break;
      case 'measure_co2':
        homekitAccessory
          .getService(Service.CarbonDioxideSensor)
          .getCharacteristic(Characteristic.CarbonDioxideLevel)
          .updateValue(capValue('measure_co2'));
        break;
    }
  }

  // Return device to app.js
  return homekitAccessory;
}
