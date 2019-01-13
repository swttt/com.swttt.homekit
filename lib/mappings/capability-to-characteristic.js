const { Characteristic }      = require('hap-nodejs');
const { AirPressure }         = require('../custom-characteristics');
const { READ, WRITE, NOTIFY } = Characteristic.Perms;

function mapColorTemperature(input, inputStart, inputEnd, outputStart, outputEnd) {
  return outputStart + ((outputEnd - outputStart) / (inputEnd - inputStart)) * (input - inputStart);
}

// get() converts a Homey (capability) value to a HomeKit value
// set() converts a HomeKit value to a Homey (capability) value
const W = (capability, characteristic, { get = v => v, set = v => v } = {}) => {
  // Create a wrapper class that extends the characteristic and adds a
  // `setHomeyContext()` method that will add `get/set` event handlers
  // to perform mapping to/from Homey capabilities.
  class Wrapper extends characteristic {
    setHomeyContext(ctx) {
      const perms = this.props.perms;

      if (READ in perms) {
        this.on('get', function get(cb) {
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
            value = get(value);
          } catch(e) {
            return cb(e);
          }
          return cb(null, value);
        }.bind(ctx));
      }

      if (WRITE in perms) {
        this.on('set', function set(value, cb) {
          try {
            value = set(value);
          } catch(e) {
            return cb(e);
          }
          this.log(`[ ${ this.device.name } ] setting '${ capability }' to '${ value }'`);
          this.device.setCapabilityValue(capability, value);
          cb();
        }.bind(ctx));
      }
    }
  }
  Wrapper.CAPABILITY = capability;
  Wrapper.name       = characteristic.name;
  return Wrapper;
}

// Common mapping transformations
const MapBoolean = {
  get: v => v === 1,
  set: v => Number(v),
};

const MapPercentage = {
  get: v => Number((v / 100).toFixed(2)),
  set: v => v * 100,
};

module.exports = {
  alarm_battery: W('alarm_battery', Characteristic.StatusLowBattery,        MapBoolean),
  alarm_co2:     W('alarm_co2',     Characteristic.CarbonDioxideDetected,   MapBoolean),
  alarm_co:      W('alarm_co',      Characteristic.CarbonMonoxideDetected,  MapBoolean),
  alarm_contact: W('alarm_contact', Characteristic.ContactSensorState,      MapBoolean),
  alarm_motion:  W('alarm_motion',  Characteristic.MotionDetected),         // HK uses BOOL as well, no conversion needed
  alarm_smoke:   W('alarm_smoke',   Characteristic.SmokeDetected,           MapBoolean),
  alarm_tamper:  W('alarm_tamper',  Characteristic.StatusTampered,          MapBoolean),
  button:        W('button',        Characteristic.ProgrammableSwitchEvent, { get: v => true, set: v => 0 }), // convert to "Single Press"
  dim:           W('dim',           Characteristic.Brightness,              MapPercentage),
  homealarm_state: [
    W('homealarm_state', Characteristic.SecuritySystemCurrentState, {
      get: v => [ 'partially_armed', 'armed', 'partially_armed', 'disarmed', 'armed' ][v],
      set: v => ( { armed : 1, disarmed : 3, partially_armed : 0 }[v] ),
    }),
    W('homealarm_state', Characteristic.SecuritySystemTargetState, {
      get: v => [ 'partially_armed', 'armed', 'partially_armed', 'disarmed', 'armed' ][v],
      set: v => ( { armed : 1, disarmed : 3, partially_armed : 0 }[v] ),
    }),
  ],
  light_hue:         W('light_hue',         Characteristic.Hue,              { get: v => v / 360, set: v => v * 360 }),
  light_saturation:  W('light_saturation',  Characteristic.Saturation,       MapPercentage),
  light_temperature: W('light_temperature', Characteristic.ColorTemperature, {
    get: v => mapColorTemperature(v, 140, 500, 0, 1),
    set: v => mapColorTemperature(v, 0, 1, 140, 500),
  }),
  locked:            [
    W('locked', Characteristic.LockCurrentState, MapBoolean),
    W('locked', Characteristic.LockTargetState,  MapBoolean),
  ],
  measure_battery:     W('measure_battery',     Characteristic.BatteryLevel),
  measure_co2:         W('measure_co2',         Characteristic.CarbonDioxideLevel),
  measure_co:          W('measure_co',          Characteristic.CarbonMonoxideLevel),
  measure_humidity:    W('measure_humidity',    Characteristic.CurrentRelativeHumidity),
  measure_pressure:    W('measure_pressure',    AirPressure),
  measure_temperature: W('measure_temperature', Characteristic.CurrentTemperature),
  onoff:               W('onoff',               Characteristic.On),
  target_temperature:  W('target_temperature',  Characteristic.TargetTemperature),
  thermostat_mode:     [
    W('thermostat_mode', Characteristic.CurrentHeatingCoolingState,
      v => [ 'off', 'heat', 'cool' ][v]         || 'auto',
      v => ( { off : 0, heat : 1, cool : 2 }[v] || 3 ) // 3 === 'auto'
    ),
    W('thermostat_mode', Characteristic.TargetHeatingCoolingState,
      v => [ 'off', 'heat', 'cool' ][v]         || 'auto',
      v => ( { off : 0, heat : 1, cool : 2 }[v] || 3 ) // 3 === 'auto'
    ),
  ],
  volume_mute:           W('volume_mute', Characteristic.Volume, v => 0,       v => 0),
  volume_set:            W('volume_set',  Characteristic.Volume, MapPercentage),
  windowcoverings_state: W('windowcoverings_state', Characteristic.PositionState,
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
