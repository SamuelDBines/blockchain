const fs = require('fs')

class file {
  read(filename) {
    return fs.readFileSync(filename);
  }
  write(filename, data) {
    if (typeof data === 'object') {
      fs.writeFileSync(filename, JSON.stringify(data));
    } else {
      fs.writeFileSync(filename, data);
    }

  }
}
module.exports = file;