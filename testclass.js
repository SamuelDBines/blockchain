const Encryption = require('./encryption.js');
const enc = new Encryption();
const ENCRYPTKEY = 'aes-128-cbc';
const data = {
  "data": "here"
}
const test = enc.encrypt(ENCRYPTKEY, 'strings', "astrin")
const test2 = enc.encrypt(ENCRYPTKEY, 'strings', "astrin")
console.log(test == test2);