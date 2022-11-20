module.exports = (Mapper, Service, Characteristic) => ({
  class:    'socket',
  service:  Service.Outlet,
  required: {
    onoff : Mapper.Characteristics.OnOff
  }
});
