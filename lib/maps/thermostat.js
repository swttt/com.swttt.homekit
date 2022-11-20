module.exports = (Mapper, Service, Characteristics) => ({
  class:    'thermostat',
  service:  Service.Thermostat,
  required: {
    target_temperature:  Mapper.Characteristics.Temperature.Target,
    measure_temperature: Mapper.Characteristics.Temperature.Current,
    thermostat_mode:     [
      Mapper.Characteristics.HeatingCoolingState.Current,
      Mapper.Characteristics.HeatingCoolingState.Target,
    ]
  },
  optional : {
    // Required but not supported by Homey
    [ Symbol() ] : Mapper.Characteristics.Temperature.DisplayUnits,
    // Optional
    measure_humidity: Mapper.Characteristics.RelativeHumidity.Current,
  }
});
