module.exports = (Mapper, Service, Characteristic) => ({
  class : 'light',
  service: Service.Lightbulb,
  required: {
    onoff : Mapper.Characteristics.OnOff
  },
  optional: {
    dim:               Mapper.Characteristics.Light.Dim,
    light_hue:         Mapper.Characteristics.Light.Hue,
    light_saturation:  Mapper.Characteristics.Light.Saturation,
    light_temperature: Mapper.Characteristics.Light.Temperature,
  }
});
