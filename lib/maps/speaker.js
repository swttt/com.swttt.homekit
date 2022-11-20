module.exports = (Mapper, Service, Characteristic) => ({
  class:    'speaker',
  service:  Service.Speaker,
  required: {
    volume_mute: Mapper.Characteristics.Mute,
  },
  optional: {
    onoff:      Mapper.Characteristics.Active,
    volume_set: Mapper.Characteristics.Volume,
  }
});
