/* global Homey */
void function() {
  if (! Homey.isMock) return;

  Homey.setSettings({
    pairedDevices : { 1 : true, 2 : false, 3 : true }
  });

  const ICON = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';

  Homey.addRoutes([
    {
      method: 'GET',
      path:   '/devices',
      fn:     function(args, cb) {
        cb(null, {
          1 : { name: 'Lamp Woonkamer',  id : 1, class : 'light',  iconObj : { url : ICON }, capabilities : [ 'onoff', 'dim' ], zoneName: 'Woonkamer'  },
          2 : { name: 'Lamp Overloop',   id : 2, class : 'light',  iconObj : { url : ICON }, capabilities : [ 'onoff', 'dim' ], zoneName: 'Overloop'   },
          3 : { name: 'Schakelaar Kast', id : 3, class : 'socket', iconObj : { url : ICON }, capabilities : [ 'onoff' ],        zoneName: 'Woonkamer'  },
          4 : { name: 'Bewegingsmelder', id : 4, class : 'sensor', iconObj : { url : ICON }, capabilities : [ 'alarm_motion' ], zoneName: 'Slaapkamer' },
        });
      }
    },
    {
      method: 'GET',
      path:   '/clear-storage',
      fn:     function(args, cb) {
        console.log('clear storage', args);
        cb();
      }
    }
  ]);

  Homey.registerOnHandler('log.new', function(ev, cb) {
    cb([
      { time : '10:12', type : 'info',    string : 'This is an info line' },
      { time : '10:13', type : 'success', string : 'This is a success line' },
      { time : '10:19', type : 'error',   string : 'This is an error line' },
      { time : '10:32', type : 'success', string : 'This is another success line' },
      { time : '10:19',                   string : 'This is an undefined line' },
    ]);
  });
}();
