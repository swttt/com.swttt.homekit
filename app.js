"use strict";

const HAS = require('has-node')

function init() {

  Homey.log("Starting homekit!");



  let config = new HAS.Config('Homey', '81:E6:B6:43:BC:2C', HAS.categories.bridge, __dirname + '/userdata/homey.json', 8090, '123-00-123');

  let server = new HAS.Server(config);

  //light
  let bridge = new HAS.Accessory(1);

  let identify = HAS.predefined.Identify(1, undefined, (value, callback) => {
      console.log('Bridge Identify', value);
      callback(HAS.statusCodes.OK);
    }),
    manufacturer = HAS.predefined.Manufacturer(2, 'Hamyar'),
    model = HAS.predefined.Model(3, 'Model2017'),
    name = HAS.predefined.Name(4, 'Bridge'),
    serialNumber = HAS.predefined.SerialNumber(5, 'ABCDEFGH'),
    firmwareVersion = HAS.predefined.FirmwareRevision(6, '1.0.0');
  bridge.addServices(HAS.predefined.AccessoryInformation(1, [identify, manufacturer, model, name, serialNumber, firmwareVersion]));

  server.addAccessory(bridge);


  //light
  let light = new HAS.Accessory(2);

  let lightIdentify = HAS.predefined.Identify(1, undefined, (value, callback) => {
      console.log('Light Identify', value);
      callback(HAS.statusCodes.OK);
    }),
    lightManufacturer = HAS.predefined.Manufacturer(2, 'Fibaro'),
    lightModel = HAS.predefined.Model(3, 'Dimmer2'),
    lightName = HAS.predefined.Name(4, 'Dimmer'),
    lightSerialNumber = HAS.predefined.SerialNumber(5, 'ABCDEFGHIJ'),
    lightFirmwareVersion = HAS.predefined.FirmwareRevision(6, '1.0.0');
  light.addServices(HAS.predefined.AccessoryInformation(1, [lightIdentify, lightManufacturer, lightModel, lightName, lightSerialNumber, lightFirmwareVersion]));


  let on = HAS.predefined.On(1, false, (value, callback) => {
    console.log('Light Status', value);
    callback(HAS.statusCodes.OK);
  });
  light.addServices(HAS.predefined.Lightbulb(2, [on]));
  //server.onIdentify will be used only when server is not paired, If server is paired identify.onWrite will be used
  server.onIdentify = identify.onWrite;

  server.addAccessory(light);

  //Starts the server
  server.startServer();

}

module.exports.init = init;
