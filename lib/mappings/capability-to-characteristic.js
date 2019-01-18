const { Service, Characteristic } = require('hap-nodejs');
const { AirPressure }             = require('../custom-characteristics');
const { READ, WRITE, NOTIFY }     = Characteristic.Perms;

function mapColorTemperature(input, inputStart, inputEnd, outputStart, outputEnd) {
  return outputStart + ((outputEnd - outputStart) / (inputEnd - inputStart)) * (input - inputStart);
}

// Common mapping transformations
// fromHomey() converts a Homey (capability) value to a HomeKit value
// toHomey() converts a HomeKit value to a Homey (capability) value
const MapBoolean = {
  fromHomey: v => Number(v),
  toHomey:   v => v === 1,
};

const MapPercentage = {
  fromHomey: v => v * 100,
  toHomey:   v => Number((v / 100).toFixed(2)),
};

const MAP = [
  [
    'alarm_battery',
    Characteristic.StatusLowBattery,
    MapBoolean
  ],
  [
    'alarm_co2',
    Characteristic.CarbonDioxideDetected,
    MapBoolean
  ],
  [
    'alarm_co',
    Characteristic.CarbonMonoxideDetected,
    MapBoolean
  ],
  [
    'alarm_contact',
    Characteristic.ContactSensorState,
    MapBoolean
  ],
  [
    'alarm_motion',
    Characteristic.MotionDetected
    // HK uses BOOL as well, no conversion needed
  ],
  [
    'alarm_smoke',
    Characteristic.SmokeDetected,
    MapBoolean
  ],
  [
    'alarm_tamper',
    Characteristic.StatusTampered,
    MapBoolean
  ],
  [
    'button',
    Characteristic.ProgrammableSwitchEvent,
    {
      fromHomey: v => 0,    // convert to "Single Press"
      toHomey:   v => true,
    }
  ],
  [
    'dim',
    Characteristic.Brightness,
    MapPercentage
  ],
  [
    'homealarm_state',
    Characteristic.SecuritySystemCurrentState,
    {
      fromHomey: v => ( { armed : 1, disarmed : 3, partially_armed : 0 }[v] ),
      toHomey:   v => [ 'partially_armed', 'armed', 'partially_armed', 'disarmed', 'armed' ][v],
    }
  ],
  [
    'homealarm_state',
    Characteristic.SecuritySystemTargetState,
    {
      fromHomey: v => ( { armed : 1, disarmed : 3, partially_armed : 0 }[v] ),
      toHomey:   v => [ 'partially_armed', 'armed', 'partially_armed', 'disarmed', 'armed' ][v],
    }
  ],
  [
    'light_hue',
    Characteristic.Hue,
    {
      fromHomey: v => v * 360,
      toHomey:   v => v / 360,
    }
  ],
  [
    'light_saturation',
    Characteristic.Saturation,
    MapPercentage
  ],
  [
    'light_temperature',
    Characteristic.ColorTemperature,
    {
      fromHomey: v => mapColorTemperature(v, 0, 1, 140, 500),
      toHomey:   v => mapColorTemperature(v, 140, 500, 0, 1),
    }
  ],
  [
    'locked',
    Characteristic.LockCurrentState,
    MapBoolean
  ],
  [
    'locked',
    Characteristic.LockTargetState,
    MapBoolean
  ],
  [
    'measure_battery',
    Characteristic.BatteryLevel
  ],
  [
    'measure_co2',
    Characteristic.CarbonDioxideLevel
  ],
  [
    'measure_co',
    Characteristic.CarbonMonoxideLevel
  ],
  [
    'measure_humidity',
    Characteristic.CurrentRelativeHumidity
  ],
  [
    'measure_luminance',
    Characteristic.CurrentAmbientLightLevel
  ],
  [
    'measure_pressure',
    AirPressure
  ],
  [
    'measure_temperature',
    Characteristic.CurrentTemperature
  ],
  [
    'measure_temperature',
    Characteristic.TemperatureDisplayUnits,
    {
      // default to °C
      fromHomey: v => 0
    }
  ],
  [
    'onoff',
    Characteristic.On
  ],
  [
    'onoff',
    Characteristic.OutletInUse, // not sure if we want to add this to all onoff services
    {
      fromHomey: v => true
    }
  ],
  [
    'target_temperature',
    Characteristic.TargetTemperature
  ],
  /* XXX: already set for `measure_temperature`
  [
    'target_temperature',
    Characteristic.TemperatureDisplayUnits,
    {
      // default to °C
      fromHomey: v => 0
    }
  ],
  */
  [
    'thermostat_mode',
    Characteristic.CurrentHeatingCoolingState,
    {
      fromHomey: v => ( { off : 0, heat : 1, cool : 2 }[v] || 3 ), // 3 === 'auto'
      toHomey:   v => [ 'off', 'heat', 'cool' ][v]         || 'auto',
    }
  ],
  [
    'thermostat_mode',
    Characteristic.TargetHeatingCoolingState,
    {
      fromHomey: v => ( { off : 0, heat : 1, cool : 2 }[v] || 3 ), // 3 === 'auto'
      toHomey:   v => [ 'off', 'heat', 'cool' ][v]         || 'auto',
    }
  ],
  [
    'volume_mute',
    Characteristic.Volume,
    {
      fromHomey: v => 0,
      toHomey:   v => 0,
    }
  ],
  [
    'volume_set',
    Characteristic.Volume,
    MapPercentage
  ],
  [
    'windowcoverings_state',
    Characteristic.PositionState,
    {
      fromHomey: v => ( { up : 1 , idle : 2, down : 0 }[v] ),
      toHomey:   v => [ 'down', 'up', 'idle' ][v],
    }
  ]
];

module.exports.lookup = function capabilityToCharacteristic(capabilities) {
  return MAP.filter(mapping => mapping[0] in capabilities);
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
