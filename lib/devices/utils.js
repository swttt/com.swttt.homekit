const getCapabilityValue = (device, capability) => {
  return (capability in (device.capabilitiesObj || {})) ? device.capabilitiesObj[capability].value : null;
};

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

        if (!group) {
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

module.exports = {
    getCapabilityValue,
    returnCapabilityValue,
    getCapabilityNameSegments,
    getCapabilityGroups,
    DEFAULT_GROUP_NAME,
}
