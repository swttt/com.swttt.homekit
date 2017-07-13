'use strict'
const HAS = require('has-node');
var server = {};
var uniqueid = 2;

function configServer(homey) {
  console.log(homey.hostname + ' used for config.')
  this.config = new HAS.Config(homey.hostname, '71:E7:D6:42:BD:3C', HAS.categories.bridge, '../userdata/homey.json', 8090, '123-00-321');
  server = new HAS.Server(this.config);
  var bridge = new HAS.Accessory(1);
  var identify = HAS.predefined.Identify(1, undefined, function(value, callback) {
      console.log('Bridge Identify', value);
      callback(HAS.statusCodes.OK);
    }),
    manufacturer = HAS.predefined.Manufacturer(2, 'Athom'),
    model = HAS.predefined.Model(3, 'V1'),
    name = HAS.predefined.Name(4, homey.hostname),
    serialNumber = HAS.predefined.SerialNumber(5, homey.boot_id),
    firmwareVersion = HAS.predefined.FirmwareRevision(6, homey.homey_version);
  bridge.addServices(HAS.predefined.AccessoryInformation(1, [identify, manufacturer, model, name, serialNumber, firmwareVersion]));
  server.addAccessory(bridge);
  server.onIdentify = identify.onWrite;
}

function startServer() {
  server.startServer();
}

function stopServer() {
  server.stopServer();
}

function addDevice(device, api) {
  var id = uniqueid;
  console.log('Going to add ' + id);
  var fan = new HAS.Accessory(id);
  var fanIdentify = HAS.predefined.Identify(1, undefined, function(value, callback) {
      console.log('Fan Identify', value);
      callback(HAS.statusCodes.OK);
    }),
    fanManufacturer = HAS.predefined.Manufacturer(2, device.driver.owner_name),
    fanModel = HAS.predefined.Model(3, device.driver.id),
    fanName = HAS.predefined.Name(4, device.name),
    fanSerialNumber = HAS.predefined.SerialNumber(5, device.id),
    fanFirmwareVersion = HAS.predefined.FirmwareRevision(6, '1.0.0');
  fan.addServices(HAS.predefined.AccessoryInformation(1, [fanIdentify, fanManufacturer, fanModel, fanName, fanSerialNumber, fanFirmwareVersion]));
  var on = HAS.predefined.On(1, false, function(value, callback) {
    console.log(device.name + ' Status', value);
    
    callback(HAS.statusCodes.OK);
  });
  fan.addServices(HAS.predefined.Lightbulb(id, [on]));
  server.addAccessory(fan);
  console.log('Device ' + device.name + ' finished!')
  uniqueid = uniqueid + 1;
}

module.exports = {
  startServer: startServer,
  stopServer: stopServer,
  configServer: configServer,
  addDevice: addDevice
}
