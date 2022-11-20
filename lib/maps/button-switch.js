module.exports = (Mapper, Service, Characteristic) => ({
  class : 'button',
  service: Service.Switch,
  required: {
    onoff : {
      characteristics: Characteristic.On,
      set:             Mapper.Accessors.OnOff.set,
      // a button is stateless, so we will always have it turned off
      get:             Mapper.Fixed.False,
    }
  }
});
