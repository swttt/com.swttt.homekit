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

### Homey firmware v1.5 and v2

Starting from app version 3.0.0, this app can only run on Homey's v2 firmware. The reason for this is that this firmware has introduced backward incompatible changes that don't work on older versions of the firmware.

Some, but not all, additional features that will be introduced from app version 3.0.0 will be backported to a separate `v1.5` branch. This branch can be manually installed on Homey using [`athom-cli`](https://www.npmjs.com/package/athom-cli).

Assuming that you have `athom-cli` and `git` installed (and working already):

```
$ git clone --single-branch --branch v1.5 https://github.com/swttt/com.swttt.homekit
$ cd com.swttt.homekit
$ athom app install
```

## Changelog

### 3.0.6

- Wait longer after a reboot for devices to settle to prevent iOS from not recognizing devices anymore

### 3.0.5

- Prevent non-existent capabilities from being accessed/used
- Cleanups
- Debouncing dim so it doesn't glitch as much

### 3.0.4

- Better check on required capabilities for devices to prevent crashes

### 3.0.3

- Also check `device.virtualClass` during device discovery.

### 3.0.2

- Fix to prevent issues due to Athom's implementation hijacking our TCP port

### 3.0.1

- Fixed an issue with the settings page not being shown

### 3.0.0

- Homey v2 firmware support
- Changes to settings pages
- Option to clear persistent storage to resolve issues with Homey not being found by iOS

### 2.1.3

- Delay start of Homekit server until device count has settled (#93)

### 2.1.2
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
