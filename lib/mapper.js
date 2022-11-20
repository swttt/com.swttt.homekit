const {
  Accessory,
  Service,
  Characteristic,
  AccessoryEventTypes
} = require('hap-nodejs');

const upperFirst            = s => String(s).replace(/^./, m => m[0].toUpperCase());
const normalizeCapability   = capability   => capability.split('.')[0];
const normalizeCapabilities = capabilities => Object.keys(capabilities.reduce((acc, cap) => (acc[normalizeCapability(cap)] = true, acc), {}));
const mapValue              = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;

class MappedDevice {
  #device;
  #logger;
  #maps      = [];
  #accessory = null;

  constructor(device, map, logger = console.log) {
    this.#device      = device;
    this.#device.name = this.#device.name || `${ upperFirst(device.class) } Device`;
    this.#logger      = logger;
    this.#maps.push(map);
  }

  addMap(map) {
    this.#maps.push(map);
  }

  createAccessory() {
    const accessory = new Accessory(this.#device.name, this.#device.id);

    accessory.on(AccessoryEventTypes.IDENTIFY, (paired, callback) => {
      this.log(identify);
      // NOOP
      callback();
    });

    accessory
      .getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Manufacturer, String(this.#device.driverUri).replace(/^homey:app:/, ''))
      .setCharacteristic(Characteristic.Model,        `${ this.#device.name } (${ this.#device.zoneName || 'onbekende zone' })`)
      .setCharacteristic(Characteristic.SerialNumber, this.#device.id);

    return accessory;
  }

  groupCapabilities() {
    return this.#device.capabilities.reduce((acc, cap) => {
      const [ capability, group = '' ] = cap.split('.');

      if (! acc[group]) acc[group] = [];
      acc[group].push(capability);
      return acc;
    }, {})
  }

  accessorize() {
    const [ cachedAccessory, device ] = [ this.#accessory, this.#device ];

    // shortcut
    if (cachedAccessory) return cachedAccessory;

    // start creating HomeKit accessory
    const accessory = this.#accessory = this.createAccessory();

    // group capabilities based on their suffix (so `onoff.1` and `dim.1` are
    // assumed to belong together)
    const groups = this.groupCapabilities();

    // for each group, and each map, create a service
    for (const [ group, capabilities ] of Object.entries(groups)) {
      let firstService = null;

      for (const map of this.#maps) {
        // use group as subtype so we can add more than one
        // instance of the same service to the accessory
        const service = accessory.addService(map.service, device.name, group || 'default');

        // link services together
        if (firstService) {
          firstService.addLinkedService(service);
        } else {
          firstService = service;
        }

        // for each (supported) capability, create characteristics
        for (const prefix of capabilities) {
          // full name of capability
          const capability = `${ prefix }${ group ? '.' + group : '' }`;

          // get characteristic maps for this capability
          const characteristicMaps = map.required?.[prefix] || map.optional?.[prefix];
          if (! characteristicMaps) {
            // unable to map this particular capability
            continue;
          }

          for (const characteristicMap of [ characteristicMaps ].flat()) {
            // determine getters/setters:
            // - first generate an array of getters/setters
            // - check if the device has this capability:
            //   - if so : use the first get/set function in the array
            //   - if not: use the second get/set function (the "fallback")
            //
            // this allows required characteristics to be implemented for devices
            // that don't have the matching capability
            const getters = [ characteristicMap.get ].flat();
            const setters = [ characteristicMap.set ].flat();
            const getter  = getters[ device.capabilities.includes(capability) ? 0 : 1 ];
            const setter  = setters[ device.capabilities.includes(capability) ? 0 : 1 ];

            // next step: create each characteristic (there can be multiple) with
            // all the relevant event handlers
            const characteristics = [ characteristicMap.characteristics ].flat().map(klass => {
              const characteristic = service.getCharacteristic(klass);

              if (getter) {
                characteristic.onGet(async () => {
                  const value = device.capabilitiesObj?.[capability]?.value;
                  if (value === undefined) throw Error(`missing capability value for '${ capability }`);
                  return await getter(value, device);
                });
              }
              if (setter) {
                characteristic.onSet(async value => {
                  await this.#device.setCapabilityValue(capability, await setter(value, device));
                });
              }

              return characteristic;
            });

            // lastly: create a capability instance and update the
            // characteristic(s) when the capability changes value
            device.makeCapabilityInstance(capability, async rawValue => {
              const value = await getter(rawValue, device);

              this.log(`capability update - capability=${ capability } value=${ value } raw=${ rawValue }`);

              for (const characteristic of characteristics) {
                characteristic.updateValue(value);
              }
            });
          }
        }
      }
    }

    return accessory;
  }

  log(...messages) {
    this.#logger(`[${ this.toString() }]`, ...messages);
  }

  toString() {
    return `${ this.#device.name } - ${ this.#maps.map(map => 'Service.' + map.service.name).join(', ') }`;
  }
}

module.exports = Mapper = new (class MapperImpl {
  #MAPS    = [];
  #DEVICES = {};
  #logger  = console.log;

  setLogger(logger) {
    this.#logger = logger;
  }

  createMap(obj) {
    // XXX: validate `obj`
    this.#MAPS.push(obj);
  }

  mapDevice(device) {
    const FAIL = device => ( this.#DEVICES[device.id] = null, null );

    // check cache first
    if (device.id in this.#DEVICES) return this.#DEVICES[device.id];

    // find maps that match the device class or virtual class
    const possibleMaps = this.#MAPS.filter(m => {
      const classes = [ m.class ].flat();
      return classes.includes(device.class) || classes.includes(device.virtualClass);
    });
    if (! possibleMaps.length) return FAIL(device);

    // normalize list of device capabilities
    const capabilities = normalizeCapabilities(device.capabilities);

    // filter possible maps against required capabilities
    const usableMaps = possibleMaps.filter(map => {
      const required = Object.keys(map.required);
      return required.every(cap => capabilities.includes(cap));
    });
    if (! usableMaps.length) return FAIL(device);

    // start with the first map
    const mappedDevice = this.#DEVICES[device.id] = new MappedDevice(device, usableMaps.shift(), this.#logger);

    // then apply the next maps (will become linked services)
    for (const map of usableMaps) {
      mappedDevice.addMap(map);
    }

    // Done
    return mappedDevice;
  }

  canMapDevice(device) {
    return !! this.mapDevice(device);
  }
})();

Mapper.Fixed = {
  True:   () => true,
  False:  () => false,
  Null:   () => null,
}

Mapper.Accessors = {
  Identity : {
    get : value => value,
    set : value => value,
  },
  Boolean : {
    get : value => !!value,
    set : value => !!value,
  },
  OnOff : {
    get : value => value,
    set : value => value,
  },
  Temperature : {
    get : value => value,
    set : value => value,
  },
  RelativeHumidity : {
    get : value => value * 100,
    set : value => value / 100,
  },
  Mute : {
    get : value => value,
    set : value => value,
  },
  Volume : {
    get : value => value * 100,
    set : value => value / 100,
  },
  RotationSpeed : {
    get : value => value * 100,
    set : value => value / 100,
  },
  DoorState : {
    get : value => Characteristic.CurrentDoorState[ value ? 'CLOSED' : 'OPEN'],
    set : value => value === Characteristic.TargetDoorState.CLOSED,
  },
  LockState : {
    get : value => Characteristic.LockCurrentState[ value ? 'SECURED' : 'UNSECURED' ],
    set : value => value === Characteristic.LockTargetState.SECURED,
  },
  LeakDetected : {
    get : value => Characteristic.LeakDetected[ value ? 'LEAK_DETECTED' : 'LEAK_NOT_DETECTED' ],
    set : value => value === Characteristic.LeakDetected.LEAK_DETECTED,
  },
  ContactSensorState : {
    get : value => Characteristic.ContactSensorState[ value ? 'CONTACT_DETECTED' : 'CONTACT_NOT_DETECTED' ],
    set : value => value === Characteristic.ContactSensorState.CONTACT_DETECTED,
  },
  SmokeDetected : {
    get : value => Characteristic.SmokeDetected[ value ? 'SMOKE_DETECTED' : 'SMOKE_NOT_DETECTED' ],
    set : value => value === Characteristic.SmokeDetected.SMOKE_DETECTED,
  },
  Brightness : {
    get : value => value * 100,
    set : value => value / 100,
  },
  Hue : {
    get : value => value * 360,
    set : value => value / 360,
  },
  Saturation : {
    get : value => value * 100,
    set : value => value / 100,
  },
  ColorTemperature : {
    get : async (value, device) => {
      // make sure the device is set to the correct light mode
      if (device.capabilitiesObj?.light_mode !== 'temperature') {
        await device.setCapabilityValue('light_mode', 'temperature').catch(() => {});
      }
      return mapValue(value, 0, 1, 140, 500);
    },
    set : value => mapValue(value, 140, 500, 0, 1),
  },
  Position : {
    get : value => value * 100,
    set : value => value / 100,
  },
  PositionState : {
    Increasing: { get : () => Characteristic.PositionState.INCREASING },
    Decreasing: { get : () => Characteristic.PositionState.DECREASING },
    Stopped:    { get : () => Characteristic.PositionState.STOPPED    },
  },
  ProgrammableSwitchEvent : {
    SinglePress : {
      get : () => Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS,
      set : () => true,
    },
    DoublePress : {
      get : () => Characteristic.ProgrammableSwitchEvent.DOUBLE_PRESS,
      set : () => true,
    },
    LongPress : {
      get : () => Characteristic.ProgrammableSwitchEvent.LONG_PRESS,
      set : () => true,
    },
  },
  HeatingCoolingState : {
    Current : {
      // Not quite the correct mapping: Homey supports `auto` mode, HomeKit doesn't. We'll default to `HEAT` when `auto` is set.
      get : value => Characteristic.CurrentHeatingCoolingState[ value === 'off' ? 'OFF' : value === 'cool' ? 'COOL' : 'HEAT' ]
    },
    Target : {
      get : value => Characteristic.TargetHeatingCoolingState[ value.toUpperCase() ],
      set : value => [ 'off', 'heat', 'cool', 'auto' ][value],
    }
  }
};

Mapper.Characteristics = {
  OnOff:         { characteristics: Characteristic.On,               ...Mapper.Accessors.OnOff },
  Active:        { characteristics: Characteristic.Active,           ...Mapper.Accessors.OnOff },
  Brightness:    { characteristics: Characteristic.Brightness,       ...Mapper.Accessors.Brightness },
  Mute:          { characteristics: Characteristic.Mute,             ...Mapper.Accessors.Mute },
  Volume:        { characteristics: Characteristic.Volume,           ...Mapper.Accessors.Volume },
  RotationSpeed: { characteristics: Characteristic.RotationSpeed,    ...Mapper.Accessors.RotationSpeed },
  ProgrammableSwitchEvent : {
    characteristics : Characteristic.ProgrammableSwitchEvent,
    ...Mapper.Accessors.ProgrammableSwitchEvent.SinglePress
  },
  Temperature:   {
    Current:      { characteristics : Characteristic.CurrentTemperature, ...Mapper.Accessors.Temperature },
    Target:       { characteristics : Characteristic.TargetTemperature,  ...Mapper.Accessors.Temperature },
    DisplayUnits: {
      characteristics : Characteristic.TemperatureDisplayUnits,
      // yay metric!
      get : () => Characteristic.TemperatureDisplayUnits.CELCIUS
    }
  },
  RelativeHumidity:   {
    Current: { characteristics : Characteristic.CurrentRelativeHumidity, ...Mapper.Accessors.RelativeHumidity },
    Target:  { characteristics : Characteristic.TargetRelativeHumidity,  ...Mapper.Accessors.RelativeHumidity },
  },
  HeatingCoolingState : {
    Current: { characteristics : Characteristic.CurrentHeatingCoolingState, ...Mapper.Accessors.HeatingCoolingState.Current },
    Target:  { characteristics : Characteristic.TargetHeatingCoolingState,  ...Mapper.Accessors.HeatingCoolingState.Target },
  },
  Light:         {
    Dim:         { characteristics: Characteristic.Brightness,       ...Mapper.Accessors.Brightness },
    Hue:         { characteristics: Characteristic.Hue,              ...Mapper.Accessors.Hue },
    Saturation:  { characteristics: Characteristic.Saturation,       ...Mapper.Accessors.Saturation },
    Temperature: { characteristics: Characteristic.ColorTemperature, ...Mapper.Accessors.ColorTemperature },
  },
  WindowCoverings : {
    Set : {
      characteristics : [ Characteristic.CurrentPosition, Characteristic.TargetPosition ],
      ...Mapper.Accessors.Position
    },
    PositionState : {
      characteristics: Characteristic.PositionState,
      ...Mapper.Accessors.PositionState
    }
  }
};

Object.values(require('require-all')(__dirname + '/maps')).forEach(mapper => {
  Mapper.createMap(mapper(Mapper, Service, Characteristic));
});
