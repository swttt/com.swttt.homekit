const Characteristic = require('hap-nodejs').Characteristic;

module.exports.AirPressure = class AirPressure extends Characteristic {

  constructor() {
    super('Air Pressure', AirPressure.UUID);
    this.setProps({
      format:   Characteristic.Formats.UINT16,
      unit:     'mbar',
      minValue: 700,
      maxValue: 1200,
      minStep:  1,
      perms:    [ Characteristic.Perms.READ, Characteristic.Perms.NOTIFY ]
    });
    this.value = this.getDefaultValue();
  }

};

module.exports.AirPressure.UUID = 'E863F10F-079E-48FF-8F27-9C2605A29F52';
