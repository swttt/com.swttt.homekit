module.exports = (Mapper, Service, Characteristic) => ({
  class : 'sensor',
  service: Service.SmokeSensor,
  required: {
    alarm_smoke : {
      characteristics : Characteristic.SmokeDetected,
      ...Mapper.Accessors.SmokeDetected
    }
  }
});
