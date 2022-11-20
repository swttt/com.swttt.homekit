module.exports = (Mapper, Service, Characteristic) => ({
  class : 'sensor',
  service: Service.HumiditySensor,
  required: {
    measure_humidity: Mapper.Characteristics.RelativeHumidity.Current
  }
});
