var encryption = require('./encryption.js')
const encpt = new encryption();
class Block {
  constructor(previous, transactions, key, password) {

    this.previous = previous.hash;
    const object = {
      hash: encpt.encrypt(key, password, JSON.stringify(transactions)),
      previous: previous.previous
    }
    this.hash = encpt.encrypt(key, previous.hash, JSON.stringify(object));
  }
  getHash() {
    return this.hash
  }
}
module.exports = Block;