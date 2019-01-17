const { Service }         = require('hap-nodejs');
const CapabilityToService = require('./capability-to-service');

const MAP = {
  //other:           Service.,
  socket:          Service.Outlet,
  light:           Service.Lightbulb,
  //vacuumcleaner:   Service.,
  fan:             Service.Fan,
  heater:          Service.HeaterCooler,
  thermostat:      Service.Thermostat,
  //  sensor:          Service.,
  //kettle:          Service.,
  //coffeemachine:   Service.,
  homealarm:       Service.SecuritySystem,
  speaker:         Service.Speaker,
  button:          Service.StatelessProgrammableSwitch,
  doorbell:        Service.Doorbell,
  lock:            Service.LockMechanism,
  windowcoverings: Service.WindowCovering,
  //tv:              Service.,
  //amplifier:       Service.,
  curtain:         Service.WindowCovering,
  blinds:          Service.WindowCovering,
  sunshade:        Service.WindowCovering,
  //remote:          Service.,
};

module.exports.lookup = function classToService(classes, capabilities) {
  // Try a full match against the device classes.
  for (const klass of classes) {
    if (klass in MAP) {
      return MAP[klass]
    }
  }
  // If we weren't able to match class, try matching against capabilities.
  return CapabilityToService.lookup(capabilities);
};
