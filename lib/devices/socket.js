const Accessory                 = require('hap-nodejs').Accessory;
const Service                   = require('hap-nodejs').Service;
const Characteristic            = require('hap-nodejs').Characteristic;
const debounce                  = require('lodash.debounce');
const {
  getCapabilityNameSegments,
  returnCapabilityValue,
  getCapabilityGroups,
  setupAccessoryInformations,
}                               = require('./utils');

module.exports = function(device/*, api*/) {
  // Init device
  const homekitAccessory = new Accessory(device.name, device.id);

  // Set device info
  setupAccessoryInformations(homekitAccessory, device);

  // Device identify when added
  homekitAccessory.on('identify', function(paired, callback) {
    console.log(device.name + ' identify');
    callback();
  });

  const capabilityGroups = getCapabilityGroups(device.capabilities, isSocketCapability);

  capabilityGroups.forEach((group, groupIndex, groups) => {
    setupGroupService({ device, group, groups, homekitAccessory });
  });

  // Return device to app.js
  return homekitAccessory;
}

const setupGroupService = ({ device, group, groups, homekitAccessory }) => {
  const { capabilities, groupName } = group;

  // Register accessory service
  const service = homekitAccessory.addService(...getServiceBuildArguments({ groupName, groups, device, group }));

  // For Outlet to work correctly we need to configure this characteristic, see details https://github.com/homebridge/HAP-NodeJS/issues/167
  service
    .getCharacteristic(Characteristic.OutletInUse)
    .on('get', function(callback) {
      callback(null, true);
    });

  // Add service characteristics
  capabilities.forEach((capability) => registerCharacteristics({ capability, device, service }));

  // On realtime event update the device
  capabilities.forEach((capability) => registerCapabilityListener({ capability, device, service }));
}

const registerCharacteristics = ({ capability, device, service }) => {
  const { capabilityBaseName } = getCapabilityNameSegments(capability);

  // Onoff
  if (capabilityBaseName === 'onoff') {
    service
      .getCharacteristic(Characteristic.On)
      .on('set', function(value, callback) {
        device.setCapabilityValue(capability, value)
        callback();
      })
      .on('get', returnCapabilityValue(device, capability));
  }

  // Brightness
  if (capabilityBaseName === 'dim') {
    service
      .addCharacteristic(Characteristic.Brightness)
      .on('set', debounce(function(value, callback) {
        device.setCapabilityValue(capability, value / 100)
        callback();
      }, 500))
      .on('get', returnCapabilityValue(device, capability, v => v * 100));
  }
};

const registerCapabilityListener = ({ device, capability, service }) => {
  console.log('created listener for - ' + capability);

  const listener = (value) => {
    onStateChange({ service, capability, value, device });
  };

  // For Homey device we want to use full capability name
  try {
    device.makeCapabilityInstance(capability, listener);
  } catch(e) {
    console.log(`Unable to create instance for ${ capability }: ${ e.message }`);
  }
}

const onStateChange = ({ service, capability, value, device }) => {
  console.log('State Change - ' + device.name + ' - ' + capability + ' - ' + value);
  const { capabilityBaseName } = getCapabilityNameSegments(capability)

  if (capabilityBaseName === 'onoff') {
    service.getCharacteristic(Characteristic.On).updateValue(value);
  } else if (capabilityBaseName === 'dim') {
    service.getCharacteristic(Characteristic.Brightness).updateValue(value * 100);
  }
}

const isSocketCapability = (capability) => {
  const { capabilityBaseName } = getCapabilityNameSegments(capability)
  return ['onoff', 'dim'].includes(capabilityBaseName);
}

const getServiceBuildArguments = ({ device, groupName, groups, group }) => {
  const isSingleService = groups.length === 1;
  const serviceName = isSingleService ? device.name : getServiceName({ device, group })

  return [Service.Outlet, serviceName, groupName];
};

// Name service by first capability title, if its present? NOTE: Maybe there are better ways
const getServiceName = ({ device, group }) => {
  const capability = group.capabilities[0];
  const capabilityDetails = device.capabilitiesObj ? device.capabilitiesObj[capability] : {};

  return capabilityDetails.title || device.name;
};

