class Transaction {
  constructor(type, information, access, createBy) {
    const timestamp = new Date();
    const actions = {
      // timestamp = new Date(),
      type,
      access,
      createBy,
      timestamp
    }
    this.transaction = Object.assign(actions, information)

  }
  getTransaction() {
    return this.transaction;
  }

}
module.exports = Transaction;