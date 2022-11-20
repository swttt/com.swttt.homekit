module.exports = (Mapper, Service, Characteristic) => ({
  class : 'sensor',
  service: Service.LeakSensor,
  required: {
    alarm_water : {
      characteristics : Characteristic.LeakDetected,
      ...Mapper.Accessors.LeakDetected
    }
  }
});
