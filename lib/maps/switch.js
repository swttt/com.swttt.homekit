module.exports = (Mapper, Service, Characteristic) => ({
  class : 'switch',
  service : Service.Switch,
  required : {
    onoff : Mapper.Characteristics.OnOff
  }
});
