module.exports = (Mapper, Service, Characteristic) => ({
  class:    'heater',
  service:  Service.HeaterCooler,
  required: {
    onoff:               Mapper.Characteristics.Active,
    measure_temperature: Mapper.Characteristics.Temperature.Current,
  },
  optional : {
    dim: Mapper.Characteristics.RotationSpeed,
    dummy_target_heater_cooler_state : [ null, {
      characteristic : Characteristic.TargetHeaterCoolerState,
      get : () => Characteristics.TargetHeaterCoolerState.HEAT,
    }],
    dummy_current_heater_cooler_state : [ null, {
      characteristic : Characteristic.CurrentHeaterCoolerState,
      get : device => {
        const isOn = device.capabilitiesObj?.onoff?.value === true;
        return Characteristics.CurrentHeaterCoolerState[ isOn ? 'HEATING' : 'INACTIVE' ];
      }
    }],
  }
});
