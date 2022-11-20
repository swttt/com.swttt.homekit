module.exports = (Mapper, Service, Characteristic) => ({
  class:    'heater',
  service:  Service.HeaterCooler,
  required: {
    onoff:               Mapper.Characteristics.Active,
    measure_temperature: Mapper.Characteristics.Temperature.Current,
  },
  optional : {
    dim: Mapper.Characteristics.RotationSpeed,
    // These two are required but not mappable to anything on Homey's side.
    [ Symbol() ] : [ null, {
      characteristic : Characteristic.TargetHeaterCoolerState,
      get : () => Characteristics.TargetHeaterCoolerState.HEAT,
    }],
    [ Symbol() ] : [ null, {
      characteristic : Characteristic.CurrentHeaterCoolerState,
      get : device => {
        const isOn = device.capabilitiesObj?.onoff?.value === true;
        return Characteristics.CurrentHeaterCoolerState[ isOn ? 'HEATING' : 'INACTIVE' ];
      }
    }],
  }
});
