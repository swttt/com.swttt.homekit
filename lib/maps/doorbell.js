module.exports = (Mapper, Service, Characteristic) => ({
  class:    'doorbell',
  service:  Service.Doorbell,
  required: {
    button : Mapper.Characteristics.ProgrammableSwitchEvent,
  },
  optional: {
    dim:         Mapper.Characteristics.Brightness,
    volume_mute: Mapper.Characteristics.Mute,
    volume_set:  Mapper.Characteristics.Volume,
  }
});
