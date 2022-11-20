module.exports = (Mapper, Service, Characteristic) => ({
  class:    'button',
  service:  Service.StatelessProgrammableSwitch,
  required: {
    button : Mapper.Characteristics.ProgrammableSwitchEvent,
  },
});
