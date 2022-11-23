module.exports = {
  async getDevices({ homey }) {
    return await homey.app.getDevices();
  },
  async addDevice({ homey, params, body }) {
    return await homey.app.addDeviceById(params.id);
  },
  async deleteDevice({ homey, params, body }) {
    return await homey.app.deleteDeviceById(params.id);
  },
  async clearStorage({ homey }) {
    Homey.app.clearStorage();
    return { value : true };
  },
};
