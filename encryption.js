const crypto = require('crypto');
class encryption {
  encrypt(key, password, data) {
    const cipher = crypto.createCipher(key, password);
    return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
  }
  decrypt(key, password, data) {
    const dicipher = crypto.createDecipher(key, password);
    return dicipher.update(data, 'hex', 'utf8') + dicipher.final('utf8');
  }
}
module.exports = encryption;