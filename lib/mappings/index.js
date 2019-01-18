module.exports = {
  ClassToService:             require('./class-to-service'),
  CapabilityToCharacteristic: require('./capability-to-characteristic'),
  CapabilityToService:        require('./capability-to-service'),
  // Helpers.
  GetCapabilityValue(device, cap) {
    if (device.capabilitiesObj && cap in device.capabilitiesObj) {
      return device.capabilitiesObj[cap].value;
    } else if (device.state && cap in device.state) {
      return device.state[cap];
    } else {
      const error = Error('UNKNOWN_CAPABILITY');
      error.capability = cap;
      throw error;
    }
  }
};
