const { Accessory, Service, Characteristic } = require('../../modules/hap-nodejs');

const getCapabilityValue = (device, capability) => {
  return (capability in (device.capabilitiesObj || {})) ? device.capabilitiesObj[capability].value : null;
};

const isCapability = (capability, type) => capability && (capability.startsWith(type) || capability.startsWith(type + '.'));

const returnCapabilityValue = (device, capability, xfrm = v => v) => {
  return function(callback) {
    const value = getCapabilityValue(device, capability);
    return callback(null, value === null ? this.value : xfrm(value));
  }
};

const DEFAULT_GROUP_NAME = 'default';

const getCapabilityNameSegments = (name) => {
  const [capabilityBaseName, groupName = DEFAULT_GROUP_NAME] = name.split('.');

  return { capabilityBaseName, groupName };
};

/**
 * in some cases there are capabilities with group suffix,
 * e.g. 'onoff' and 'onoff.1',
 * we will transform base capabilities list into list of distinct groups
 * e.g.
 * [
 *   { groupName: 'default', capabilities: ['onoff'] },
 *   { groupName: '1', capabilities: ['onoff.1'] },
 * ]
 */
const getCapabilityGroups = (capabilities, supportedCapabilityFilter = () => true) => {
  return capabilities.reduce((groups, capability) => {
    const { groupName, capabilityBaseName } = getCapabilityNameSegments(capability)

    if (!supportedCapabilityFilter(capabilityBaseName)) {
      return groups;
    }

    const group = groups.find((group) => group.groupName === groupName);

    if (! group) {
      groups.push({
          groupName,
          capabilities: [capability],
      })
    } else {
      group.capabilities.push(capability);
    }

    return groups;
  }, [])
}

const setupAccessoryInformations = (accessory, device) => {
  if (device.driverUri === 'homey:app:de.karpienski.hkcontroller') {
    accessory
      .getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Manufacturer, device.settings.labelManufacturer)
      .setCharacteristic(Characteristic.Model, device.settings.labelModel)
      .setCharacteristic(Characteristic.SerialNumber, device.settings.labelSerialNumber)
      .setCharacteristic(Characteristic.HardwareRevision, device.settings.labelHardwareRevision)
      .setCharacteristic(Characteristic.FirmwareRevision, device.settings.labelFirmwareRevision)
      .setCharacteristic(Characteristic.Version, device.settings.labelVersion);
  } else {
    accessory
      .getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Manufacturer, String(device.driverUri).replace(/^homey:app:/, ''))
      .setCharacteristic(Characteristic.Model, `${ device.name } (${ device.zoneName || "onbekende zone" })`)
      .setCharacteristic(Characteristic.SerialNumber, device.id);
  }
}

module.exports = {
  getCapabilityValue,
  isCapability,
  returnCapabilityValue,
  getCapabilityNameSegments,
  getCapabilityGroups,
  setupAccessoryInformations,
  DEFAULT_GROUP_NAME,
}
