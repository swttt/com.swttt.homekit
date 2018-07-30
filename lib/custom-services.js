const Service = require('hap-nodejs').Service;
const { AirPressure } = require('./custom-characteristics'); 

module.exports.AirPressureSensor = class AirPressureSensor extends Service {

  constructor(displayName, subtype) {
    super(displayName, AirPressureSensor.UUID, subtype);
    this.addCharacteristic(AirPressure);
  }

};

module.exports.AirPressureSensor.UUID = 'E863F00A-079E-48FF-8F27-9C2605A29F52';
