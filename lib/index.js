'use strict'

module.exports = {
  createLight: require('./devices/light.js'),
  createLock: require('./devices/lock.js'),
  createStateBlinds: require('./devices/stateblinds.js'),
  createDimBlinds: require('./devices/dimblinds.js'),
  createSocket: require('./devices/socket.js'),
  createSwitch: require('./devices/switch.js'),
  createMotionSensor: require('./devices/motion.js'),
  createButton: require('./devices/button.js'),
  createThermostat: require('./devices/thermostat.js'),
  createContactSensor: require('./devices/contact.js'),
  createSmokeSensor: require('./devices/smoke.js'),
  createCOSensor: require('./devices/CO.js'),
  createCO2Sensor: require('./devices/CO2.js')
}
