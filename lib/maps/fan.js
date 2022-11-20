module.exports = (Mapper, Service, Characteristic) => ({
  class:    'fan',
  service:  Service.Fan,
  required: {
    onoff : Mapper.Characteristics.OnOff
  },
  optional : {
    dim: Mapper.Characteristics.RotationSpeed
  }
});
