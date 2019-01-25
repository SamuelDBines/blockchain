const express = require('express')
const http = require('http')
const app = express()
const bcrypt = require('bcrypt')
const bodyParser = require('body-parser')
const session = require("express-session");
const Transaction = require('./transactions.js');
const blockchain = require('./chainSetup.js');
const Participant = require('./participant.js');
const participant = new Participant();
const File = require('./writeData.js');
const file = new File();
const ITEMLIST = 'items.json'
const NAVLINKS = 'links.json';
const stateValue = 0;
let CUSTOMER_CHAIN = undefined;
let ADMIN_CHAIN = undefined;
const ip = require("ip");
app.use(express.static('public'))
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
)
const ENCRYPTKEY = 'aes-128-cbc';
app.use(bodyParser.json())
const types = {
  ORDER: 'ORDER',
  INSERT: 'INSERT',
  DELETE: 'DELETE',
  UPDATE: 'UPDATE',
  RETURN: 'RETURN',
  DELIVERED: 'DELIVERED',
  DISPATCH: 'DISPATCH',
  DAMAGED: 'DAMAGED',
  ATTACHED: 'ATTACHED'
}
const accessLevel = {
  CUSTOMER: 'CUSTOMER',
  DRIVER: 'DRIVER',
  SUPPLIER: 'SUPPLIER',
  ADMIN: 'ADMIN'
}
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: 'ABC123',
  cookie: {
    maxAge: 600000
  }
}));

/* Rulls prevent access */
const ensureAdmin = function (req, res, next) {
  if (req.session.user && req.session.user.access == accessLevel.ADMIN) {
    return next();
  }
  var err = new Error('Not Found');
  err.status = 404;
  return next(err)
}
const ensureSupplier = function (req, res, next) {
  if (req.session.user && req.session.user.access == accessLevel.SUPPLIER) {
    return next();
  }
  var err = new Error('Not Found');
  err.status = 404;
  return next(err)
}
const ensureDriver = function (req, res, next) {
  if (req.session.user && req.session.user.access == accessLevel.DRIVER) {
    return next();
  }
  var err = new Error('Not Found');
  err.status = 404;
  return next(err)
}

/* Pulls order history for customer (May not be recent) */

const ensureDataPull = function (req, res, next) {
  const result = CUSTOMER_CHAIN; //blockchain.viewChainContents(accessLevel.CUSTOMER);
  if (req.session.user) {

    let filter = Object.keys(result)
      .map(function (k) {
        return result[k];
      })
    if (req.session.user.access == accessLevel.ADMIN) {
      const admin = ADMIN_CHAIN;
      filter = filter.concat(Object.keys(admin)
        .map(function (k) {
          return admin[k];
        }))
    }
    if (req.session.user.access == accessLevel.CUSTOMER) {
      filter = filter.filter(transaction => {
        return transaction.createBy == req.session.user.email || false
      });
    }
    req.body = filter;
    return next();

  }

  var err = new Error('Not Found');
  err.status = 404;
  return next(err)
}


const ensureRecentPull = function (req, res, next) {
  const result = blockchain.getWorldState(accessLevel.CUSTOMER); //blockchain.viewChainContents(accessLevel.CUSTOMER);
  if (req.session.user) {

    let filter = Object.keys(result)
      .map(function (k) {
        return result[k];
      })
    if (req.session.user.access == accessLevel.ADMIN) {
      const admin = blockchain.getWorldState(accessLevel.ADMIN);
      filter = filter.concat(Object.keys(admin)
        .map(function (k) {
          return admin[k];
        }))
    }
    if (req.session.user.access == accessLevel.CUSTOMER) {
      filter = filter.filter(transaction => {
        return transaction.createBy == req.session.user.email || false
      });
    }
    req.body = filter;
    return next();

  }

  var err = new Error('Not Found');
  err.status = 404;
  return next(err)
}
// let count = 0;
// blockchain.addBlock(blockchain.getChain(), new Transaction('33', 'hi world', '3'), '2')
// blockchain.addBlock(blockchain.getChain(), new Transaction('33', 'hi world', '4'), '2')
// let currentBlock = blockchain.getChain();
// let previous = JSON.parse(encpt.decrypt(ENCRYPTKEY, currentBlock.previous, currentBlock.hash));


const test = {
  "previous": "4169d5182679e9626a1ff424704df44e5f6f87931a203ee8929c6733bb33d8a99f7ba21db96ad801e9027a2334ea4c7bc1a3cfd7c5f7ad686aaaa1f62005b5f157bc9d4ae8f742393e17eb3bf040a588a1bace8545f21ef79be78dee5154ed52279801ecd97147429e4827668ab63e88fb4b34225d1087efb8e85f92144fe6e6da1f7eff1fef7d02f76dbba602296cda270b6de5f233d4dc11f2042a7b692aec",
  "hash": "8992f05766f19090937593c214942a0d935ee867c4ad0075732e5d7b808e93d5410534882b0d2a8935917d4b77ac2b2cc7f86775129b312266f28d9843e074321c32b98226840bcde9dc18791076448b0d795c01dc16ded8344ef6f8060bb1b21b865155af7538f89901a559f5db94a5199975631e30f6bbd12f4615e835e5668d43729ebd1dea901ebab966040cda5bfa5ef6ba4c04f7c5a5aff2867ea6cf7f60bb820a5d3c1c3f02f78275831e4e0dfb43359bd3e5accf277e889099bdeb7040dc54f23129c009e794067a3658ab2e2987392d0bdafd00c1ee6ab8e68e67486d84e4f50a172d3396b961e668acfd6735768dd6a14045edbc882ebd19624826e077e306d02534f2af5a0644bdbf700f283583a9a6dbc17a30219ad8e962cd55b887669fdab9af0f1973a9bedae39dfe004ed127a03c6266724f141722b079c37c22871f6be0b8498f8d9eca021be186919b4b5ce558c143841a8813fb7bba01def131d005a5e3b705be23980385618e"
}
console.log(blockchain.getChainLength());
console.log(blockchain.compareChain(test, 1));
// currentBlock = blockchain.getChain();
// console.log(currentBlock);
// const unlockblock = encpt.decrypt(ENCRYPTKEY, currentBlock.previous, currentBlock.hash);
// console.log(JSON.parse(unlockblock));
// ress = JSON.parse(unlockblock)
// console.log(ress.hash);
// console.log(ress.previous);
// const debock = encpt.decrypt(ENCRYPTKEY, ress.previous, currentBlock.previous);
// console.log(debock)
// console.log(encpt.decrypt(ENCRYPTKEY, 'test', JSON.parse(debock).hash))
// console.log(encpt.decrypt(ENCRYPTKEY, currentBlock.previous, currentBlock.hash))
// console.log(encpt.decrypt(ENCRYPTKEY, hash));
// var hash = bcrypt.hashSync("bacon", bcrypt.genSaltSync(10));

// console.log(
//   bcrypt.compareSync("bacon", hash)); // true
// bcrypt.compareSync("veggies", hash); // false
// console.log(chainCode)
// console.log(keys)

// var readline = require('readline');
// var rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
//   terminal: false
// });

// rl.on('line', function (line) {
//   console.log(line);
// })


// var net = require('net');
// var client = net.connect({
//   port: 1337
// }, function () {
//   console.log('connected to server!');
// });
// client.on('data', function (data) {
//   console.log(data.toString());
//   // client.end();
// });

// client.write("howdy");

// client.on('end', function () {
//   console.log('disconnected from server');
// });

// app.post('/chat', async (req, res) => {
//   console.log(req.body.close);
//   client.write(req.body.chat);
// })
// app.get('*', (req, res) => {
//   console.log('herer');
// })
app.get('/api/links', async (req, res) => {
  const itemList = JSON.parse(file.read(NAVLINKS));
  if (req.session.user) {
    if (req.session.user.access == accessLevel.ADMIN)
      return res.json(itemList.admin)
    if (req.session.user.access == accessLevel.SUPPLIER)
      return res.json(itemList.supplier)
    if (req.session.user.access == accessLevel.DRIVER)
      return res.json(itemList.driver)
    return res.json(itemList.customer)
  }
  res.json(itemList.loggedOut)
})
app.get('/api/dispatch', (req, res) => {
  let map = Object.values(CUSTOMER_CHAIN);
  let dups = {};
  map.forEach(element => {
    dups[element.timestamp] ? dups[element.timestamp].push(element.type) : dups[element.timestamp] = [element.type];
  })
  Object.keys(dups).forEach(element => {
    if (dups[element].includes("RETURN") || dups[element].includes("DELIVERED") || dups[element].includes("ORDER") || dups[element].includes("DISPATCH")) {
      delete dups[element];
    }
  })
  return res.json(map.filter(x => Object.keys(dups).includes(x.timestamp)))
})
app.get('/api/attach', (req, res) => {
  let map = Object.values(CUSTOMER_CHAIN);
  let dups = {};
  map.forEach(element => {
    dups[element.timestamp] ? dups[element.timestamp].push(element.type) : dups[element.timestamp] = [element.type];
  })
  Object.keys(dups).forEach(element => {
    if (dups[element].includes("RETURN") || dups[element].includes("DELIVERED") || dups[element].includes("ATTACHED") || dups[element].includes("DISPATCH")) {
      delete dups[element];
    }
  })
  return res.json(map.filter(x => Object.keys(dups).includes(x.timestamp)))
})
app.post('/register', async (req, res) => {
  const userData = {
    name: req.body.name,
    email: req.body.email
  }
  const accountCreated = participant.createUser('access.json', ENCRYPTKEY, (req.body.email + req.body.password), userData, req.body.access || accessLevel.CUSTOMER)
  if (accountCreated)
    return res.redirect('/home');
  return res.send('user exists');
})
app.post('/login', async (req, res) => {
  if (req.session.user)
    return res.send("Already logged in");

  const loggedIn = participant.loginUser('access.json', ENCRYPTKEY, (req.body.email + req.body.password))
  if (loggedIn) {
    req.session.user = JSON.parse(loggedIn);

    return res.redirect('/home');
  }

  res.send('Unknown user');
})


app.post('/supplier/add', ensureSupplier, (req, res, next) => {
  const itemList = JSON.parse(file.read(ITEMLIST));
  console.log(itemList);
  if (itemList.some(item => item.code == req.body.code)) {
    var err = new Error('Item Code Exists');
    err.status = 404;
    return next(err)
  }
  try {
    const transaction = new Transaction(types.INSERT, req.body, accessLevel.ADMIN, req.session.user.email).transaction;
    blockchain.addBlock(blockchain.getChain(), transaction, accessLevel.ADMIN)
    itemList.push(req.body);
    file.write(ITEMLIST, JSON.stringify(itemList));
    res.redirect('/home')
  } catch (e) {
    return res.redirect('/error.html')
  }

})
app.post('/supplier/remove', ensureSupplier, (req, res, next) => {
  let itemList = JSON.parse(file.read(ITEMLIST));
  console.log(itemList);

  try {
    if (itemList.some(item => item.code == req.body.code)) {
      itemList = itemList.filter(item => item.code != req.body.code)
      const transaction = new Transaction(types.DELETE, req.body, accessLevel.ADMIN, req.session.user.email).transaction;
      blockchain.addBlock(blockchain.getChain(), transaction, accessLevel.ADMIN)
      file.write(ITEMLIST, JSON.stringify(itemList));
      return res.redirect('/home')
    }
  } catch (e) {
    var err = new Error('Cannot find item Code');
    err.status = 404;
    return next(err)
  }
})
app.get('/supplier/items', ensureSupplier, (req, res) => {
  return res.redirect('/addItem.html')
})
app.get('/admin/register', ensureAdmin, (req, res) => {
  return res.redirect('/registerParticpant.html')
})

app.get('/logout', (req, res) => {
  req.session.user = undefined;
  res.redirect('/login');
})

app.get('/getChain', async (req, res) => {
  res.json(blockchain.getChain());
})
app.get('/', async (req, res) => {
  res.redirect('/home')
})
app.get('/home', async (req, res) => {
  if (req.session.user) {
    console.log(req.session.user.access)
    if (req.session.user.access == accessLevel.CUSTOMER)
      return res.redirect('/homePage.html')
    return res.redirect('/home.html')
  }
  res.redirect('/login')
})
app.get('/login', async (req, res) => {
  res.redirect('/login.html')
})
app.get('/register', async (req, res) => {
  res.redirect('/register.html')
})
app.get('/orders', ensureSupplier, async (req, res) => {
  res.redirect('/viewOrders.html')
})
app.get('/delivery', ensureDriver, async (req, res) => {
  res.redirect('/viewDelivery.html')
})
app.get('/view', async (req, res) => {

  if (req.session.user) {
    console.log(req.session.user)
    if (req.session.user.access == accessLevel.ADMIN || req.session.user.access == accessLevel.SUPPLIER || req.session.user.access == accessLevel.DRIVER)
      return res.redirect('/viewAdmin.html')
    return res.redirect('/viewchain.html')
  }
  res.redirect('/login')
})
app.get('/recent', async (req, res) => {
  if (req.session.user) {
    return res.redirect('/viewRecent.html')
  }
  res.redirect('/login')
})
app.get('/account', async (req, res) => {
  if (req.session.user)
    // console.log(req.session.user)
    return res.redirect('/account.html')
  res.redirect('/login')
})
app.get('/api/account', async (req, res) => {
  if (req.session.user)
    // console.log(req.session.user)
    return res.json(req.session.user)
  res.redirect('/login')
})
app.get('/pullKey', async (req, res) => {
  console.log('here');
  res.json(bcrypt.hashSync(JSON.stringify(chainCode), bcrypt.genSaltSync(10)));
})
const httpServer = http.createServer(app)

app.get('/api/items', async (req, res) => {
  res.json(JSON.parse(file.read(ITEMLIST)));
})


/*
 Changing an Items status 
*/
app.post('/api/items', async (req, res) => {
  console.log(req.payload)
  res.json(JSON.parse(file.read(ITEMLIST)));
})
app.post('/api/order', async (req, res) => {
  const itemList = JSON.parse(file.read(ITEMLIST));
  console.log(req.body)
  if (req.session.user && itemList.some(item => item.code == req.body.code)) {
    try {
      req.body.timestamp = new Date();
      req.body.type = types.ORDER;
      const transaction = new Transaction(types.ORDER, req.body, accessLevel.CUSTOMER, req.session.user.email).transaction;
      blockchain.addBlock(blockchain.getChain(), transaction, accessLevel.CUSTOMER)
      console.log('ordered');
      return res.redirect('/success.html');
    } catch (e) {
      return res.redirect('/error.html')
    }
  }

  res.redirect('/error.html');

})
app.post('/api/return', async (req, res) => {
  console.log('here' + JSON.stringify(req.body))
  if (req.session.user) {
    if (ensureComplete([types.RETURN], req.body, accessLevel.CUSTOMER, req.body.createBy)) {
      return res.json({
        response: "item cannot be returned again"
      })
    }
    try {
      // delete req.body.timestampc
      req.body.type = types.RETURN
      const transaction = new Transaction(types.RETURN, req.body, accessLevel.CUSTOMER, req.session.user.email).transaction;

      blockchain.addBlock(blockchain.getChain(), transaction, accessLevel.CUSTOMER)
      return res.json({
        response: "item returned"
      })
    } catch (e) {
      return res.json({
        response: "item cannot be returned again"
      })
    }

  }
  res.redirect('/error.html');
})
app.post('/api/dispatch', ensureSupplier, async (req, res) => {
  console.log('here' + JSON.stringify(req.body))
  if (req.session.user) {
    if (ensureComplete([types.RETURN, types.DAMAGED, types.DISPATCH, types.DELIVERED], req.body, accessLevel.CUSTOMER, req.body.createBy)) {
      return res.json({
        response: " this item can no longer be sent"
      })
    }
    try {
      // delete req.body.timestampc
      req.body.type = types.DISPATCH
      const transaction = new Transaction(types.DISPATCH, req.body, accessLevel.CUSTOMER, req.session.user.email).transaction;

      blockchain.addBlock(blockchain.getChain(), transaction, accessLevel.CUSTOMER)
      return res.json({
        response: "item sent to customer"
      })
    } catch (e) {
      return res.json({
        response: "item cannot be returned again"
      })
    }
  }
  res.redirect('/error.html');
})
app.post('/api/delivery', ensureDriver, async (req, res) => {
  console.log('here' + JSON.stringify(req.body))
  if (req.session.user) {

    if (ensureComplete([types.RETURN, types.DAMAGED, types.ORDER, types.DELIVERED], req.body, accessLevel.CUSTOMER, req.body.createBy))
      return res.json({
        response: "this item can no longer be sent"
      })
    try {
      // delete req.body.timestampc
      req.body.type = types.DELIVERED
      const transaction = new Transaction(types.DELIVERED, req.body, accessLevel.CUSTOMER, req.session.user.email).transaction;
      blockchain.addBlock(blockchain.getChain(), transaction, accessLevel.CUSTOMER)
      return res.json({
        response: "item delivered"
      })
    } catch (e) {
      return res.json({
        response: "Error with system try again"
      })
    }
  }
  res.redirect('/error.html');
})
app.post('/api/attached', ensureDriver, async (req, res) => {
  console.log('here' + JSON.stringify(req.body))
  if (req.session.user) {
    if (ensureComplete([types.RETURN, types.DELIVERED], req.body, accessLevel.CUSTOMER, req.body.createBy))
      return res.json({
        response: "this item can no longer be sent"
      })
    try {
      // delete req.body.timestampc
      req.body.type = types.ATTACHED
      const transaction = new Transaction(types.ATTACHED, req.body, accessLevel.CUSTOMER, req.session.user.email).transaction;
      blockchain.addBlock(blockchain.getChain(), transaction, accessLevel.CUSTOMER)
      return res.json({
        response: "Sensor attached"
      })
    } catch (e) {
      return res.json({
        response: "Error with system try again"
      })
    }
  }
  return res.json({
    response: "Error with system try again"
  })
  res.redirect('/error.html');
})
const ensureComplete = function (type, data, access, user) {
  const recentPull = blockchain.getWorldState(access);
  const recentFilter = Object.keys(recentPull).map(k => recentPull[k])
  const quickTest = recentFilter.filter(item => item.createBy == user && item.code == data.code && item.timestamp == data.timestamp).some(item => type.includes(item.type))
  if (quickTest) {
    return true;
  }
  const result = access == accessLevel.ADMIN ? ADMIN_CHAIN : CUSTOMER_CHAIN;
  const filter = Object.keys(result).map(k => result[k])
  // const transaction = new Transaction(type, data, access, user).transaction;
  return filter.filter(item => item.createBy == user && item.code == data.code && item.timestamp == data.timestamp).some(item => type.includes(item.type));
}

app.get('/api/block', ensureDataPull, async (req, res) => {
  return res.json(req.body);
})

app.get('/api/recentActivity', ensureRecentPull, async (req, res) => {

  // console.log(req.session.user)
  return res.json(req.body)
})
/* Fix Chain contents */
CUSTOMER_CHAIN = blockchain.viewChainContents(accessLevel.CUSTOMER);
console.log("Updated customer Chain")
ADMIN_CHAIN = blockchain.viewChainContents(accessLevel.ADMIN);
console.log("Updated admin Chain")
setInterval(function () {
  CUSTOMER_CHAIN = blockchain.viewChainContents(accessLevel.CUSTOMER);
  console.log("Updated customer Chain")
  ADMIN_CHAIN = blockchain.viewChainContents(accessLevel.ADMIN);
  console.log("Updated admin Chain")
}, 30000);

/* Start Server */
httpServer.listen(process.env.PORT || 8080, () =>
  console.log('HTTP is running running'),
)