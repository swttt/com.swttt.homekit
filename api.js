'use strict';
const Homey = require('homey')

module.exports = [
  {
    method : 'GET',
    path   : '/devices',
    fn     : async (args, callback) => {
      try {
        return callback(null, await Homey.app.getDevices());
      } catch(err) {
        return callback(err);
      }
    }
  },
  {
    method : 'PUT',
    path   : '/devices/:id',
    fn     : async (args, callback) => {
      try {
        await Homey.app.addDeviceById(args.params.id);
        return callback();
      } catch(err) {
        return callback(err);
      }
    }
  },
  {
    method : 'DELETE',
    path   : '/devices/:id',
    fn     : async (args, callback) => {
      try {
        Homey.app.deleteDeviceById(args.params.id);
        return callback();
      } catch(err) {
        return callback(err);
      }
    }
  },
  {
    method : 'GET',
    path   : '/clear-storage',
    fn     : async (args, callback) => {
      try {
        Homey.app.clearStorage();
        return callback(null, { value : true });
      } catch(err) {
        return callback(err);
      }
    }
  },
];
