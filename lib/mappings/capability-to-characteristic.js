const { Characteristic } = require('hap-nodejs');
const { AirPressure }    = require('../custom-characteristics');

// setFn() converts a HomeKit value to a Homey (capability) value
// getFn() converts a Homey (capability) value to a HomeKit value
const _ = (capability, characteristic, setFn = v => v, getFn = v => v) => {
  return {
    class : characteristic,
    set(value, cb) {
      try {
        value = setFn(value);
      } catch(e) {
        return cb(e);
      }
      this.log(`[ ${ this.device.name } ] setting '${ capability }' to '${ value }'`);
      this.device.setCapabilityValue(capability, value);
      cb();
    },
    get(cb) {
      let value;
      if (this.device.capabilitiesObj && capability in this.device.capabilitiesObj) {
        value = this.device.capabilitiesObj[capability].value;
      } else if (this.device.state && capability in this.device.state) {
        value = this.device.state[capability];
      } else {
        const error = Error('UNKNOWN_CAPABILITY');
        error.capability = capability;
        return cb(error);
      }
      try {
        value = getFn(value);
      } catch(e) {
        return cb(e);
      }
      return cb(null, value);
    },
  }
};

function mapColorTemperature(input, inputStart, inputEnd, outputStart, outputEnd) {
  return outputStart + ((outputEnd - outputStart) / (inputEnd - inputStart)) * (input - inputStart);
}

module.exports = {
  alarm_battery:             _('alarm_battery', Characteristic.StatusLowBattery,     v => v === 1, v => Boolean(v)),
  alarm_co2:                 _('alarm_co2', Characteristic.CarbonDioxideDetected,    v => v === 1, v => Boolean(v)),
  alarm_co:                  _('alarm_co', Characteristic.CarbonMonoxideDetected,    v => v === 1, v => Boolean(v)),
  alarm_contact:             _('alarm_contact', Characteristic.ContactSensorState,   v => v === 1, v => Boolean(v)),
  alarm_motion:              _('alarm_motion', Characteristic.MotionDetected),       // HK uses BOOL as well, no conversion needed
  alarm_smoke:               _('alarm_smoke', Characteristic.SmokeDetected,          v => v === 1, v => Boolean(v)),
  alarm_tamper:              _('alarm_tamper', Characteristic.StatusTampered,        v => v === 1, v => Boolean(v)),
  button:                    _('button', Characteristic.ProgrammableSwitchEvent,     v => true,    v => 0), // convert to "Single Press"
  dim:                       _('dim', Characteristic.Brightness,                     v => v / 100, v => v * 100),
  homealarm_state:           _('homealarm_state', Characteristic.SecuritySystemCurrentState,
    v => [ 'partially_armed', 'armed', 'partially_armed', 'disarmed', 'armed' ][v],
    v => ( { armed : 1, disarmed : 3, partially_armed : 0 }[v] ),
  ),
  light_hue:                 _('light_hue', Characteristic.Hue,                      v => v / 360, v => v * 360),
  light_saturation:          _('light_saturation', Characteristic.Saturation,        v => v / 100, v => v * 100),
  light_temperature:         _('light_temperature', Characteristic.ColorTemperature, v => mapColorTemperature(v, 140, 500, 0, 1), v => mapColorTemperature(v, 0, 1, 140, 500)),
  locked:                    _('locked', Characteristic.LockCurrentState,            v => v === 1, v => Number(v)),
  measure_battery:           _('measure_battery', Characteristic.BatteryLevel),
  measure_co2:               _('measure_co2', Characteristic.CarbonDioxideLevel),
  measure_co:                _('measure_co', Characteristic.CarbonMonoxideLevel),
  measure_humidity:          _('measure_humidity', Characteristic.CurrentRelativeHumidity),
  measure_pressure:          _('measure_pressure', AirPressure),
  measure_temperature:       _('measure_temperature', Characteristic.CurrentTemperature),
  onoff:                     _('onoff', Characteristic.On),
  target_temperature:        _('target_temperature', Characteristic.TargetTemperature),
  thermostat_mode:           _('thermostat_mode', Characteristic.CurrentHeatingCoolingState, 
    v => [ 'off', 'heat', 'cool' ][v]         || 'auto', 
    v => ( { off : 0, heat : 1, cool : 2 }[v] || 3 ) // 3 === 'auto'
  ),
  volume_mute:               _('volume_mute', Characteristic.Volume, v => 0,       v => 0),
  volume_set:                _('volume_set',  Characteristic.Volume, v => v / 100, v => v * 100),
  windowcoverings_state:     _('windowcoverings_state', Characteristic.PositionState, 
    v => [ 'down', 'up', 'idle' ][v],
    v => ( { up : 1 , idle : 2, down : 0 }[v] )
  ),
};

// TODO
// alarm_fire:{: _('{', Characteristic.),
// alarm_generic:{: _('{', Characteristic.),
// alarm_heat:{: _('{', Characteristic.),
// alarm_night:{: _('{', Characteristic.),
// alarm_pm25:{: _('{', Characteristic.),
// alarm_water:{: _('{', Characteristic.),
// channel_down:{: _('{', Characteristic.),
// channel_up:{: _('{', Characteristic.),
// light_mode:{: _('{', Characteristic.),
// lock_mode:_('lock_mode', Characteristic.LockCurrentState ),
// measure_current:{: _('{', Characteristic.),
// measure_gust_angle:{: _('{', Characteristic.),
// measure_gust_strength:{: _('{', Characteristic.),
// measure_luminance: _('measure_luminance', Characteristic.),
// measure_noise:{: _('{', Characteristic.),
// measure_pm25:              _('measure_pm25', Characteristic.AirParticulateSize, ),
// measure_power:{: _('{', Characteristic.),
// measure_rain: _('measure_rain', Characteristic.),
// measure_ultraviolet:{: _('{', Characteristic.),
// measure_voltage:{: _('{', Characteristic.),
// measure_water:{: _('{', Characteristic.),
// measure_wind_angle:{: _('{', Characteristic.),
// measure_wind_strength:{: _('{', Characteristic.),
// meter_gas:{: _('{', Characteristic.),
// meter_power:{: _('{', Characteristic.),
// meter_rain:{: _('{', Characteristic.),
// meter_water:{: _('{', Characteristic.),
// speaker_album: _('speaker_album', Characteristic.),
// speaker_artist: _('speaker_artist', Characteristic.),
// speaker_duration: _('speaker_duration', Characteristic.),
// speaker_next: _('speaker_next', Characteristic.),
// speaker_playing: _('speaker_playing', Characteristic.),
// speaker_position: _('speaker_position', Characteristic.),
// speaker_prev: _('speaker_prev', Characteristic.),
// speaker_repeat: _('speaker_repeat', Characteristic.),
// speaker_shuffle: _('speaker_shuffle', Characteristic.),
// speaker_track: _('speaker_track', Characteristic.),
// vacuumcleaner_state:{: _('{', Characteristic.),
// volume_down:{: _('{', Characteristic.),
// volume_up:{: _('{', Characteristic.),
// windowcoverings_closed:{: _('{', Characteristic.),
//  windowcoverings_set:       _('windowcoverings_set', Characteristic.TargetVerticalTiltAngle),
//  windowcoverings_tilt_down: _('windowcoverings_tilt_down', Characteristic.CurrentHorizontalTiltAngle),
//  windowcoverings_tilt_set:  _('windowcoverings_tilt_set', Characteristic.TargetHorizontalTiltAngle),
//  windowcoverings_tilt_up:   _('windowcoverings_tilt_up', Characteristic.CurrentHorizontalTiltAngle),
