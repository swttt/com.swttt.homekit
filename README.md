# Homeykit

With this app you can pair Homey to Homekit and control your devices using Siri.

After installing the app grab your iPhone or iPad.
Got to the Home app on your iOS devices, click the `+` and add new accessory.
Now you should be able to scan the code below, or add it manually.

![Image of paircode](https://github.com/swttt/com.swttt.homekit/raw/master/settings/code.png)

After Homey is paired, go to settings->Homeykit. There select the devices you want to pair with homekit.

It might take a few sec (sometimes even longer) until your device shows up in your Home app.

For now only the following classes are supported:
- Light (with RGB or Temperature)
- Socket
- Motionsensor (with lux and temp)
- Doorlock
- Door/Window sensor

---

### Issues & Feature requests

If you found any bugs you can create an issue on [github](https://github.com/swttt/com.swttt.homekit) .

Any other feature request can be added there as well.

---

### Changelog

##### 2.0.x
- Beta appstore release

---

##### 2.0.0
- Initial release where has-node got replaced by hap-nodejs
