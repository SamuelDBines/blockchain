const Chain = require('./chain.js');
const Transaction = require('./transactions.js');
let blockchain = undefined;
const File = require('./writeData.js');
const file = new File();
const FILENAME = 'chain.json'
try {
  JSON.parse(file.read(FILENAME));
  blockchain = new Chain();
  console.log('old chain');
} catch (e) {
  blockchain = new Chain();
  blockchain.createChain(new Transaction('2', 'test1', '1'), 'test');
  console.log('new chain');
}
module.exports = blockchain;