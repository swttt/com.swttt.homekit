const getCapabilityValue = module.exports.getCapabilityValue = (device, capability) => {
  return (capability in (device.capabilitiesObj || {})) ? device.capabilitiesObj[capability].value : null;
};

module.exports.returnCapabilityValue = (device, capability, xfrm = v => v) => {
  return function(callback) {
    const value = getCapabilityValue(device, capability);
    return callback(null, value === null ? this.value : xfrm(value));
  }
};
