module.exports = (Mapper, Service, Characteristic) => ({
  class:    [ 'curtain', 'blinds', 'sunshade', 'windowcoverings' ],
  service:  Service.WindowCovering,
  required: {
    windowcoverings_set : Mapper.Characteristics.WindowCoverings.Set
  },
  optional : {
    // we don't have a Homey capability that maps to the required PositionState
    // characteristic, so we'll just invent one and use the fallback to always
    // return the same value.
    [ Symbol() ] : Mapper.Characteristics.WindowCoverings.PositionState,
  }
});
