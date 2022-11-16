const { Service, Characteristic } = require('hap-nodejs');

function mapHomeyDeviceToHomeKit(device) {
  const serviceClass = DEVICE_CLASS_TO_SERVICE[device.class];

  // cannot map Homey device class to HomeKit service
  if (! serviceClass) return null;

  // instantiate service so we can check its characteristics
  const service = new serviceClass();

  // check if device has the required capabilities
  for (const characteristic of service.characteristics) {
  }
}

module.exports = { mapHomeyDeviceToHomeKit };

const DEVICE_CLASS_TO_SERVICE = {
  garagedoor : Service.GarageDoorOpener
};

const CHARACTERISTIC_TO_CAPABILITY = {
  [ Characteristic.CurrentDoorState ] : {
    capability: 'garagedoor_closed',
    map : {
      toCharacteristic:   capability => {},
      fromCharacteristic: capability => {},
    }
  },
  [ Characteristic.TargetDoorState ] : {
    capability: 'garagedoor_closed',
    map : {
      toCharacteristic:   capability => {},
      fromCharacteristic: capability => {},
    }
  },
  [ Characteristic.ObstructionDetected ] : {
    capability : 'alarm_generic'
  }
};
