const encryption = require('./encryption.js');
const File = require('./writeData');
const encpt = new encryption();
const file = new File();
class Participant {
  constructor() {

  }
  createUser(filename, key, passcode, name, access) {
    let data;
    try {
      data = JSON.parse(file.read(filename));
    } catch (e) {
      data = {}
    }
    const object = JSON.stringify(Object.assign(name, {
      access
    }))
    console.log(object);
    const distortKey = this.getDistortKey(key, passcode);
    if (!data[distortKey]) {
      data[distortKey] = {
        hash: this.setParticipant(key, passcode, object)
      }
      file.write(filename, data);
      return true;
    }
    return false;

  }
  loginUser(filename, key, passcode) {
    const data = JSON.parse(file.read(filename))
    const distortKey = this.getDistortKey(key, passcode);
    if (data[distortKey]) {
      return this.getParticipant(key, passcode, data[distortKey].hash);
    }
    return false;
  }
  getParticipant(key, passcode, data) {
    return encpt.decrypt(key, passcode, data);
  }
  setParticipant(key, passcode, data) {
    return encpt.encrypt(key, passcode, data);
  }
  getDistortKey(key, passcode) {
    return encpt.encrypt(key, passcode, passcode);
  }
}
module.exports = Participant;