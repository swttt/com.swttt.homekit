const { Service, Characteristic } = require('hap-nodejs');
const { AirPressure }             = require('../custom-characteristics');
const { READ, WRITE, NOTIFY }     = Characteristic.Perms;

function mapColorTemperature(input, inputStart, inputEnd, outputStart, outputEnd) {
  return outputStart + ((outputEnd - outputStart) / (inputEnd - inputStart)) * (input - inputStart);
}

// get() converts a Homey (capability) value to a HomeKit value
// set() converts a HomeKit value to a Homey (capability) value
const W = (capability, characteristic, { get = v => v, set = v => v } = {}) => {
  characteristic.events = {
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
        value = get(value);
      } catch(e) {
        return cb(e);
      }
      return cb(null, value);
    },
    set(value, cb) {
      try {
        value = set(value);
      } catch(e) {
        return cb(e);
      }
      this.log(`[ ${ this.device.name } ] setting '${ capability }' to '${ value }'`);
      this.device.setCapabilityValue(capability, value);
      cb();
    }
  };
  return characteristic;
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

const MAP = {
  alarm_battery: W('alarm_battery', Characteristic.StatusLowBattery,        MapBoolean),
  alarm_co2:     W('alarm_co2',     Characteristic.CarbonDioxideDetected,   MapBoolean),
  alarm_co:      W('alarm_co',      Characteristic.CarbonMonoxideDetected,  MapBoolean),
  alarm_contact: W('alarm_contact', Characteristic.ContactSensorState,      MapBoolean),
  alarm_motion:  W('alarm_motion',  Characteristic.MotionDetected),         // HK uses BOOL as well, no conversion needed
  alarm_smoke:   W('alarm_smoke',   Characteristic.SmokeDetected,           MapBoolean),
  alarm_tamper:  W('alarm_tamper',  Characteristic.StatusTampered,          MapBoolean),
  button:        W('button',        Characteristic.ProgrammableSwitchEvent, {
    get: v => true,
    set: v => 0     // convert to "Single Press"
  }),
  dim:           W('dim', Characteristic.Brightness, MapPercentage),
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
  light_hue:         W('light_hue', Characteristic.Hue, {
    get: v => v / 360,
    set: v => v * 360
  }),
  light_saturation:  W('light_saturation',  Characteristic.Saturation, MapPercentage),
  light_temperature: W('light_temperature', Characteristic.ColorTemperature, {
    get: v => mapColorTemperature(v, 140, 500, 0, 1),
    set: v => mapColorTemperature(v, 0, 1, 140, 500),
  }),
  locked:            [
    W('locked', Characteristic.LockCurrentState, MapBoolean),
    W('locked', Characteristic.LockTargetState,  MapBoolean),
  ],
  measure_battery:     W('measure_battery',   Characteristic.BatteryLevel),
  measure_co2:         W('measure_co2',       Characteristic.CarbonDioxideLevel),
  measure_co:          W('measure_co',        Characteristic.CarbonMonoxideLevel),
  measure_humidity:    W('measure_humidity',  Characteristic.CurrentRelativeHumidity),
  measure_luminance:   W('measure_luminance', Characteristic.CurrentAmbientLightLevel),
  measure_pressure:    W('measure_pressure',  AirPressure),
  measure_temperature: [
    W('measure_temperature',  Characteristic.CurrentTemperature),
    W('measure_temperature',  Characteristic.TemperatureDisplayUnits, { get: v => 0  }) // default to °C
  ],
  onoff: [
    W('onoff', Characteristic.On),
    W('onoff', Characteristic.OutletInUse, { get: v => true }), // not sure if we want to add this to all onoff services
  ],
  target_temperature: [
    W('target_temperature',  Characteristic.TargetTemperature),
    W('target_temperature',  Characteristic.TemperatureDisplayUnits, { get: v => 0 }) // default to °C
  ],
  thermostat_mode:     [
    W('thermostat_mode', Characteristic.CurrentHeatingCoolingState, {
      get: v => [ 'off', 'heat', 'cool' ][v]         || 'auto',
      set: v => ( { off : 0, heat : 1, cool : 2 }[v] || 3 ) // 3 === 'auto'
    }),
    W('thermostat_mode', Characteristic.TargetHeatingCoolingState, {
      get: v => [ 'off', 'heat', 'cool' ][v]         || 'auto',
      set: v => ( { off : 0, heat : 1, cool : 2 }[v] || 3 ) // 3 === 'auto'
    }),
  ],
  volume_mute:           W('volume_mute', Characteristic.Volume, { get: v => 0, set: v => 0 }),
  volume_set:            W('volume_set',  Characteristic.Volume, MapPercentage),
  windowcoverings_state: W('windowcoverings_state', Characteristic.PositionState, {
    get: v => [ 'down', 'up', 'idle' ][v],
    set: v => ( { up : 1 , idle : 2, down : 0 }[v] )
  }),
};

module.exports.lookup = function capabilityToCharacteristic(capabilities) {
  return Object.keys(capabilities).map(cap => MAP[cap]).filter(v => !!v);
};

// TODO
// alarm_fire
// alarm_generic
// alarm_heat
// alarm_night
// alarm_pm25
// alarm_water
// channel_down
// channel_up
// light_mode
// lock_mode
// measure_current
// measure_gust_angle
// measure_gust_strength
// measure_noise
// measure_pm25
// measure_power
// measure_rain
// measure_ultraviolet
// measure_voltage
// measure_water
// measure_wind_angle
// measure_wind_strength
// meter_gas
// meter_power
// meter_rain
// meter_water
// speaker_album
// speaker_artist
// speaker_duration
// speaker_next
// speaker_playing
// speaker_position
// speaker_prev
// speaker_repeat
// speaker_shuffle
// speaker_track
// vacuumcleaner_state
// volume_down
// volume_up
// windowcoverings_closed
// windowcoverings_set
// windowcoverings_tilt_down
// windowcoverings_tilt_set
// windowcoverings_tilt_up
