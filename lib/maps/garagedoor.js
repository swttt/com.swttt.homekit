module.exports = (Mapper, Service, Characteristic) => ({
  class: 'garagedoor',
  service : Service.GarageDoorOpener,
  required: {
    garagedoor_closed : {
      characteristics : [ Characteristic.TargetDoorState, Characteristic.CurrentDoorState ],
      ...Mapper.Accessors.DoorState
    },
  },
  optional: {
    alarm_generic : {
      characteristics : Characteristic.ObstructionDetected,
      // if device has `alarm_generic`, use Identity.Get,
      // otherwise default to Fixed.False
      get : [ Mapper.Accessors.Identity.get, Mapper.Fixed.False ],
    }
  }
});
