module.exports = (Mapper, Service, Characteristic) => ({
  class:    'lock',
  service:  Service.LockMechanism,
  required: {
    locked : {
      characteristics: [ Characteristic.LockCurrentState, Characteristic.LockTargetState ],
      ...Mapper.Accessors.LockState,
    }
  }
});
