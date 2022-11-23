const { Accessory, Service, Characteristic } = require('../../modules/hap-nodejs');
const debounce                               = require('lodash.debounce');
const {
  getCapabilityNameSegments,
  returnCapabilityValue,
  getCapabilityGroups,
  setupAccessoryInformations
} = require('./utils');

function map(inputStart, inputEnd, outputStart, outputEnd, input) {
  return outputStart + ((outputEnd - outputStart) / (inputEnd - inputStart)) * (input - inputStart);
}

module.exports = function(device/*, api*/) {

  // Init device
  const homekitAccessory = new Accessory(device.name || 'Light', device.id);

  // Set device info
  setupAccessoryInformations(homekitAccessory, device);

  // Device identify when added
  homekitAccessory.on('identify', function(paired, callback) {
    console.log(device.name + ' identify');
    callback();
  });

  const capabilityGroups = getCapabilityGroups(device.capabilities, isLightCapability);

  capabilityGroups.forEach((group, groupIndex, groups) => {
    setupGroupService({ device, group, groups, homekitAccessory });
  });

  // Return device to app.js
  return homekitAccessory;
}

const setupGroupService = ({ device, group, groups, homekitAccessory }) => {
  const { capabilities, groupName } = group;

  // Register accessory service
  const lightService = homekitAccessory.addService(...getServiceBuildArguments({ groupName, groups, device, group }));

  // Add service characteristics
  capabilities.forEach((capability) => registerCharacteristics({ capability, device, service: lightService }));

  // On realtime event update the device
  capabilities.forEach((capability) => registerCapabilityListener({ capability, device, service: lightService }));
}

const registerCharacteristics = ({ capability, device, service }) => {
  const { capabilityBaseName } = getCapabilityNameSegments(capability);

  // Onoff
  if (capabilityBaseName === 'onoff') {
    service
      .getCharacteristic(Characteristic.On)
      .on('set', function(value, callback) {
        device.setCapabilityValue(capability, value).catch(() => {});
        callback();
      })
      .on('get', returnCapabilityValue(device, capability));
  }

  // Brightness
  if (capabilityBaseName === 'dim') {
    service
      .addCharacteristic(Characteristic.Brightness)
      .on('set', debounce(function(value, callback) {
        device.setCapabilityValue(capability, value / 100).catch(() => {});
        callback();
      }, 500))
      .on('get', returnCapabilityValue(device, capability, v => v * 100));
  }

  // Saturation
  if (capabilityBaseName === 'light_saturation') {
    service
      .addCharacteristic(Characteristic.Saturation)
      .on('set', function(value, callback) {
        device.setCapabilityValue(capability, value / 100).catch(() => {});
        callback();
      })
      .on('get', returnCapabilityValue(device, capability, v => v * 100));
  }

  // Temperature
  if (capabilityBaseName === 'light_temperature') {
    service
      .addCharacteristic(Characteristic.ColorTemperature)
      .on('set', function(value, callback) {

        // If device uses light_mode and was previously set on not temperature
        // Wait for color mode to be adjusted before setting light_temperature
        if ('light_mode' in (device.capabilitiesObj || {}) && device.capabilitiesObj.light_mode.value !== 'temperature') {
          device.setCapabilityValue('light_mode', 'temperature').catch(() => {});
        }

        device.setCapabilityValue(capability, map(140, 500, 0, 1, value)).catch(() => {});
        callback();
      })
      .on('get', function(callback) {
        const value = 'light_temperature' in (device.capabilitiesObj || {}) ? device.capabilitiesObj.light_temperature.value : 1;
        callback(null, map(0, 1, 140, 500, value) || 500);
      });
  }

  // Hue
  if (capabilityBaseName === 'light_hue') {
    service
      .addCharacteristic(Characteristic.Hue)
      .on('set', function(value, callback) {
        device.setCapabilityValue(capability, value / 360).catch(() => {});
        callback();
      })
      .on('get', returnCapabilityValue(device, capability, v => v * 360));
  }
};


const registerCapabilityListener = ({ device, capability, service }) => {
  console.log('created listener for - ' + capability);

  const listener = (value) => {
    onStateChange({ service, capability, value, device });
  };

  // For Homey device we want to use full capability name
  try { device.makeCapabilityInstance(capability, listener) } catch(e) {};
}

const onStateChange = ({ service, capability, value, device }) => {
  console.log('State Change - ' + device.name + ' - ' + capability + ' - ' + value);
  const { capabilityBaseName } = getCapabilityNameSegments(capability)

  if (capabilityBaseName === 'onoff') {
    service.getCharacteristic(Characteristic.On).updateValue(value);
  } else if (capabilityBaseName === 'dim') {
    service.getCharacteristic(Characteristic.Brightness).updateValue(value * 100);
  } else if (capabilityBaseName === 'light_saturation') {
    service.getCharacteristic(Characteristic.Saturation).updateValue(value * 100);
  } else if (capabilityBaseName === 'light_temperature') {
    service.getCharacteristic(Characteristic.ColorTemperature).updateValue(map(0, 1, 140, 500, value));
  } else if (capabilityBaseName === 'light_hue') {
    service.getCharacteristic(Characteristic.Hue).updateValue(value * 360);
  }
}

const isLightCapability = (capability) => {
  const { capabilityBaseName } = getCapabilityNameSegments(capability)
  return ['onoff', 'dim', 'light_saturation', 'light_temperature', 'light_hue'].includes(capabilityBaseName);
}

const getServiceBuildArguments = ({ device, groupName, groups, group }) => {
  const isSingleService = groups.length === 1;
  const serviceName = isSingleService ? device.name : getServiceName({ device, group })

  return [Service.Lightbulb, serviceName, groupName];
};

// Name service by first capability title, if its present? NOTE: Maybe there are better ways
const getServiceName = ({ device, group }) => {
  const capability = group.capabilities[0];
  const capabilityDetails = device.capabilitiesObj ? device.capabilitiesObj[capability] : {};

  return capabilityDetails.title || device.name;
};

