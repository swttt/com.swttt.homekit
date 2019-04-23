'use strict'

module.exports = {
  createLight: require('./devices/light.js'),
  createLock: require('./devices/lock.js'),
  createStateBlinds: require('./devices/stateblinds.js'),
  createDimBlinds: require('./devices/dimblinds.js'),
  createCurtains: require('./devices/curtains.js'),
  createSocket: require('./devices/socket.js'),
  createSwitch: require('./devices/switch.js'),
  createButton: require('./devices/button.js'),
  createThermostat: require('./devices/thermostat.js'),
  createDoorbell: require('./devices/doorbell.js'),
  createSecuritySystem: require('./devices/securitysystem.js'),
  createSensor: require('./devices/sensor.js'),
  createFan: require('./devices/fan.js'),
  createSpeaker: require('./devices/speaker.js'),
}
