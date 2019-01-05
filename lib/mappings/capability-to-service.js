const { Service } = require('hap-nodejs');

module.exports = {
  onoff:               Service.Switch,
  measure_temperature: Service.TemperatureSensor,
  measure_humidity:    Service.HumiditySensor,
  measure_luminance:   Service.LightSensor,
  alarm_motion:        Service.MotionSensor,
  alarm_water:         Service.LeakSensor,
  alarm_contact:       Service.ContactSensor,
  alarm_co:            Service.CarbonMonoxideSensor,
  measure_co:          Service.CarbonMonoxideSensor,
  alarm_co2:           Service.CarbonDioxideSensor,
  measure_co2:         Service.CarbonDioxideSensor,
  button:              Service.ProgrammableSwitchEvent,
  homealarm_state:     Service.SecuritySystem,
};
