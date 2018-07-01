# Homeykit

With this app you can pair Homey to Homekit and control your devices using Siri.

After installing the app grab your iPhone or iPad.
Got to the Home app on your iOS devices, click the `+` and add new accessory.
Now you should be able to scan the code below, or add it manually.

![Image of paircode](https://github.com/swttt/com.swttt.homekit/raw/master/code.png)

After Homey has paired with HomeKit all your devices will be added. When you add or remove a device from Homey the same wil happen in HomeKit.

A future release wil support excluding zones or devices from HomeKit.

The following classes are supported:
- Light (with RGB or Temperature)
- Socket
- Switch
- Motionsensor (with lux and temp)
- Doorlock
- Door/Window sensor (with temp)
- Thermostat
- Windowblinds
- Button

---

### Issues & Feature requests

If you found any bugs you can create an issue on [github](https://github.com/swttt/com.swttt.homekit) .

Any other feature request can be added there as well.

---

### Changelog

### 2.1.1 (beta)
- Trying to fix #82

### 2.1.0
- Reintroduced settings page
- Other small fixes

### 2.0.12
- Filename uppercase fix

### 2.0.11
- Updated hap-nodejs, lodash and athom-api
- Added alarm system support for Heimdall
- Added fan support

### 2.0.10
- Fix for sensors

### 2.0.9
- Bugfixes in smoke and temperature class

#### 2.0.8
- Multiple devices added (see https://github.com/swttt/com.swttt.homekit/pull/54 )

##### 2.0.7
- Fixed color bulbs
- Fixed thermostat

---

##### 2.0.6
- Small fixes

---

##### 2.0.5
- Small fixes
- Thermostat display units added

---

##### 2.0.5
- Fixed contact sensor

---

##### 2.0.4
- Beta appstore release

---

##### 2.0.0
- Initial release where has-node got replaced by hap-nodejs
