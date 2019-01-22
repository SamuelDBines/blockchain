const Block = require('./block.js');
const Transaction = require('./transactions.js');
const Encryption = require('./encryption.js');
const File = require('./writeData.js');
const file = new File();
const encpt = new Encryption();
const ENCRYPTKEY = 'aes-128-cbc';
const FILENAME = 'chain.json'
class Chain {
  constructor() {}
  createChain(data, password) {
    const startTransaction = new Transaction('GENISUS', 'Start block of chain', '*');
    const genisus = {
      hash: encpt.encrypt(ENCRYPTKEY, '*', JSON.stringify(startTransaction.getTransaction())),
      previous: undefined,
    }
    this.chain = new Block(genisus, data, ENCRYPTKEY, password);
    file.write(FILENAME, this.chain);
  }
  addBlock(previous, data, password) {
    this.chain = new Block(previous, data, ENCRYPTKEY, password);
    file.write(FILENAME, this.chain);
  }
  getChain() {
    return JSON.parse(file.read(FILENAME));

  }
  getPrevious() {
    return this.chain.hash;
  }
  getChainLength() {
    let count = 0;
    let currentBlock = this.getChain();
    let previous = JSON.parse(encpt.decrypt(ENCRYPTKEY, currentBlock.previous, currentBlock.hash));
    while (previous.previous) {
      const unblock = encpt.decrypt(ENCRYPTKEY, previous.previous, currentBlock.previous);
      currentBlock = previous;
      previous = JSON.parse(unblock);
      count++;
    }
    return count;
  }
  viewChainContents(access) {
    let content = {};
    let count = 0;
    let currentBlock = this.getChain();
    let previous = JSON.parse(encpt.decrypt(ENCRYPTKEY, currentBlock.previous, currentBlock.hash));
    while (previous.previous) {
      const unblock = encpt.decrypt(ENCRYPTKEY, previous.previous, currentBlock.previous);
      try {
        content[count] = JSON.parse(encpt.decrypt(ENCRYPTKEY, access, previous.hash))

      } catch (e) {
        console.log('No item')
      }
      currentBlock = previous;
      previous = JSON.parse(unblock);
      count++;
    }
    return content;
  }
  getWorldState(access) {
    let content = {};
    let count = 0;
    let currentBlock = this.getChain();
    let previous = JSON.parse(encpt.decrypt(ENCRYPTKEY, currentBlock.previous, currentBlock.hash));
    let stateValue = 0;
    while (previous.previous && stateValue < 5) {
      const unblock = encpt.decrypt(ENCRYPTKEY, previous.previous, currentBlock.previous);
      try {
        content[count] = JSON.parse(encpt.decrypt(ENCRYPTKEY, access, previous.hash))

      } catch (e) {
        console.log('No item')
      }
      currentBlock = previous;
      previous = JSON.parse(unblock);
      count++;
      stateValue++;
      console.log(stateValue);
    }
    return content;
  }
  compareChain(compare, position) {
    const count = this.getChainLength();
    let currentBlock = this.getChain();
    let previous = JSON.parse(encpt.decrypt(ENCRYPTKEY, currentBlock.previous, currentBlock.hash));
    if (count > position) {

      for (var i = count; i > position; i--) {
        const unblock = encpt.decrypt(ENCRYPTKEY, previous.previous, currentBlock.previous);
        const temp = currentBlock;

        currentBlock = previous;
        if (i === position + 1) {
          currentBlock.hash = temp.previous;
        }
        previous = JSON.parse(unblock);
        console.log(i)
      }
    }
    try {
      return compare.hash === currentBlock.hash && compare.previous === currentBlock.previous;
    } catch (e) {
      return false;
    }
  }

}
module.exports = Chain;