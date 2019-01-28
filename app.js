const express = require('express')
const http = require('http')
const app = express()
const bcrypt = require('bcrypt')
const bodyParser = require('body-parser')
const session = require('express-session')
const Transaction = require('./transactions.js')
const blockchain = require('./chainSetup.js')
const Participant = require('./participant.js')
const participant = new Participant()
const File = require('./writeData.js')
const file = new File()
const ITEMLIST = 'items.json'
const NAVLINKS = 'links.json'
const stateValue = 0
let CUSTOMER_CHAIN = undefined
let CHAIN = undefined
const ip = require('ip')
var request = require('request')
app.use(express.static('public'))
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
)
const ENCRYPTKEY = 'aes-128-cbc'
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
  ATTACHED: 'ATTACHED',
}
const accessLevel = {
  CUSTOMER: 'CUSTOMER',
  DRIVER: 'DRIVER',
  SUPPLIER: 'SUPPLIER',
  ADMIN: 'ADMIN',
  SENSOR: 'SENSOR',
}
app.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: 'ABC123',
    cookie: {
      maxAge: 600000,
    },
  }),
)

/* Rulls prevent access */
const ensureAdmin = function (req, res, next) {
  if (req.session.user && req.session.user.access == accessLevel.ADMIN) {
    delete req.body.access
    return next()
  }
  var err = new Error('Not Found')
  err.status = 404
  return next(err)
}
const ensureSupplier = function (req, res, next) {
  if (
    (req.session.user && req.session.user.access == accessLevel.SUPPLIER) ||
    req.body.access == accessLevel.SENSOR
  ) {
    delete req.body.access
    return next()
  }
  var err = new Error('Not Found')
  err.status = 404
  return next(err)
}
const ensureDriver = function (req, res, next) {
  if (
    (req.session.user && req.session.user.access == accessLevel.DRIVER) ||
    req.body.access == accessLevel.SENSOR
  ) {
    delete req.body.access
    return next()
  }
  var err = new Error('Not Found')
  err.status = 404
  return next(err)
}

/* Pulls order history for customer (May not be recent) */

const ensureDataPull = function (req, res, next) {
  const result = CHAIN //blockchain.viewChainContents(accessLevel.CUSTOMER);
  if (req.session.user) {
    console.log(test)
    let filter = Object.keys(result).map(function (k) {
      return result[k]
    })
    if (req.session.user.access == accessLevel.CUSTOMER) {
      filter = filter.filter(transaction => {
        return transaction.createBy == req.session.user.email && transaction.access === accessLevel.CUSTOMER
      })
    }
    console.log(filter)
    req.body = filter
    return next()
  }

  var err = new Error('Not Found')
  err.status = 404
  return next(err)
}

const ensureRecentPull = function (req, res, next) {
  const result = blockchain.getWorldState(accessLevel.ADMIN) //blockchain.viewChainContents(accessLevel.CUSTOMER);
  if (req.session.user) {
    const filter = Object.keys(result).map(function (k) {
      return result[k]
    })
    req.body = filter;
    return next()
  }

  var err = new Error('Not Found')
  err.status = 404
  return next(err)
}


console.log(blockchain.getChainLength())

app.get('/api/links', async (req, res) => {
  const itemList = JSON.parse(file.read(NAVLINKS))
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
  let map = Object.values(CHAIN)
  let dups = {}
  map.forEach(element => {
    dups[element.timestamp] ?
      dups[element.timestamp].push(element.type) :
      (dups[element.timestamp] = [element.type])
  })
  Object.keys(dups).forEach(element => {
    if (
      dups[element].includes('RETURN') ||
      dups[element].includes('DELIVERED') ||
      dups[element].includes('ORDER') ||
      dups[element].includes('DISPATCH')
    ) {
      delete dups[element]
    }
  })
  return res.json(map.filter(x => Object.keys(dups).includes(x.timestamp)))
})
app.post('/api/checkItem', ensureSupplier, (req, res) => {
  const customer = Object.values(CHAIN)
  return res.json(customer.filter(x => x.timestamp == req.body.timestamp))
})
app.get('/api/attach', (req, res) => {
  let map = Object.values(CHAIN)
  let dups = {}
  map.forEach(element => {
    dups[element.timestamp] ?
      dups[element.timestamp].push(element.type) :
      (dups[element.timestamp] = [element.type])
  })
  Object.keys(dups).forEach(element => {
    if (
      dups[element].includes('RETURN') ||
      dups[element].includes('DELIVERED') ||
      dups[element].includes('ATTACHED') ||
      dups[element].includes('DISPATCH')
    ) {
      delete dups[element]
    }
  })
  return res.json(map.filter(x => Object.keys(dups).includes(x.timestamp)))
})
app.post('/register', async (req, res) => {
  const userData = {
    name: req.body.name,
    email: req.body.email,
  }
  const accountCreated = participant.createUser(
    'access.json',
    ENCRYPTKEY,
    req.body.email + req.body.password,
    userData,
    req.body.access || accessLevel.CUSTOMER,
  )
  if (accountCreated) return res.redirect('/home')
  return res.send('user exists')
})
app.post('/login', async (req, res) => {
  if (req.session.user) return res.send('Already logged in')

  const loggedIn = participant.loginUser(
    'access.json',
    ENCRYPTKEY,
    req.body.email + req.body.password,
  )
  if (loggedIn) {
    req.session.user = JSON.parse(loggedIn)

    return res.redirect('/home')
  }

  res.send('Unknown user')
})

app.post('/supplier/add', ensureSupplier, (req, res, next) => {
  const itemList = JSON.parse(file.read(ITEMLIST))
  console.log(itemList)
  if (itemList.some(item => item.code == req.body.code)) {
    var err = new Error('Item Code Exists')
    err.status = 404
    return next(err)
  }
  try {
    const transaction = new Transaction(
      types.INSERT,
      req.body,
      accessLevel.ADMIN,
      req.session.user.email,
    ).transaction
    blockchain.addBlock(blockchain.getChain(), transaction, accessLevel.ADMIN)
    itemList.push(req.body)
    file.write(ITEMLIST, JSON.stringify(itemList))
    res.redirect('/home')
  } catch (e) {
    return res.redirect('/error.html')
  }
})
app.post('/supplier/remove', ensureSupplier, (req, res, next) => {
  let itemList = JSON.parse(file.read(ITEMLIST))

  try {
    if (itemList.some(item => item.code == req.body.code)) {
      itemList = itemList.filter(item => item.code != req.body.code)
      const transaction = new Transaction(
        types.DELETE,
        req.body,
        accessLevel.ADMIN,
        req.session.user.email,
      ).transaction
      blockchain.addBlock(blockchain.getChain(), transaction, accessLevel.ADMIN)
      file.write(ITEMLIST, JSON.stringify(itemList))
      return res.redirect('/home')
    }
  } catch (e) {
    var err = new Error('Cannot find item Code')
    err.status = 404
    return next(err)
  }
})
app.get('/supplier/items', ensureSupplier, (req, res) => {
  return res.redirect('/addItem.html')
})
app.get('/admin/register', ensureAdmin, (req, res) => {
  return res.redirect('/registerParticpant.html')
})
/********************************************
 * ROUTES
 *******************************************/
app.get('/logout', (req, res) => {
  req.session.user = undefined
  res.redirect('/login')
})

app.get('/getChain', async (req, res) => {
  res.json(blockchain.getChain())
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
    if (
      req.session.user.access == accessLevel.ADMIN ||
      req.session.user.access == accessLevel.SUPPLIER ||
      req.session.user.access == accessLevel.DRIVER
    )
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
  console.log('here')
  res.json(bcrypt.hashSync(JSON.stringify(chainCode), bcrypt.genSaltSync(10)))
})
app.get('/api/items', async (req, res) => {
  res.json(JSON.parse(file.read(ITEMLIST)))
})

app.get('/api/update', (req, res) => {
  updateLocal()
  res.json(JSON.parse(file.read(ITEMLIST)))
})


/*
 Changing an Items status 
*/
app.post('/api/items', async (req, res) => {
  res.json(JSON.parse(file.read(ITEMLIST)))
})
app.post('/api/order', async (req, res) => {
  const itemList = JSON.parse(file.read(ITEMLIST))
  console.log("here", req.body)
  if (req.session.user && itemList.some(item => item.code == req.body.code)) {
    try {
      req.body.timestamp = new Date()
      req.body.type = types.ORDER
      const transaction = new Transaction(
        types.ORDER,
        req.body,
        accessLevel.CUSTOMER,
        req.session.user.email,
      ).transaction
      blockchain.addBlock(
        blockchain.getChain(),
        transaction,
        accessLevel.CUSTOMER,
      )
      updateCall()
      console.log("success")
      return res.redirect('/success.html')
    } catch (e) {
      return res.redirect('/error.html')
    }
  }

  res.redirect('/error.html')
})
app.post('/api/return', async (req, res) => {
  console.log('here' + JSON.stringify(req.body))
  if (req.session.user) {
    if (
      ensureComplete(
        [types.RETURN],
        req.body,
        accessLevel.CUSTOMER,
        req.body.createBy,
      )
    ) {
      return res.json({
        response: 'item cannot be returned again',
      })
    }
    try {
      // delete req.body.timestampc
      req.body.type = types.RETURN
      const transaction = new Transaction(
        types.RETURN,
        req.body,
        accessLevel.CUSTOMER,
        req.session.user.email,
      ).transaction

      blockchain.addBlock(
        blockchain.getChain(),
        transaction,
        accessLevel.CUSTOMER,
      )
      updateCall()
      return res.json({
        response: 'item returned',
      })
    } catch (e) {
      return res.json({
        response: 'item cannot be returned again',
      })
    }
  }
  res.redirect('/error.html')
})
app.post('/api/dispatch', ensureSupplier, async (req, res) => {
  console.log('here' + JSON.stringify(req.body))
  if (ensureComplete([types.RETURN, types.DAMAGED, types.DISPATCH, types.DELIVERED], req.body,
      accessLevel.CUSTOMER, req.body.createBy, )) {
    return res.json({
      response: ' this item can no longer be sent',
    })
  }
  try {
    // delete req.body.timestampc
    req.body.type = types.DISPATCH
    const transaction = new Transaction(types.DISPATCH, req.body, accessLevel.CUSTOMER, req.body.createBy, ).transaction

    blockchain.addBlock(blockchain.getChain(), transaction, accessLevel.CUSTOMER, )
    updateCall()
    return res.json({
      response: 'ITEM SENT',
      success: true,
    })
  } catch (e) {
    return res.json({
      response: 'FAILED TO DISPATCH',
    })
  }
})
app.post('/api/delivery', ensureDriver, async (req, res) => {
  console.log(req.body)
  if (ensureComplete([types.RETURN, types.DELIVERED], req.body, accessLevel.CUSTOMER, req.body.createBy)) {
    return res.json({
      response: 'FAILED DELIVERY',
      success: true,
    })
  }
  try {
    // delete req.body.timestampc
    req.body.type = types.DELIVERED
    const transaction = new Transaction(
      types.DELIVERED,
      req.body,
      accessLevel.CUSTOMER,
      req.body.createBy,
    ).transaction
    blockchain.addBlock(
      blockchain.getChain(),
      transaction,
      accessLevel.CUSTOMER,
    )
    updateCall()
    return res.json({
      response: 'ITEM DELIVERED',
      success: true,
    })
  } catch (e) {
    return res.json({
      response: 'FAILED TO DELIVER',
    })
  }
})
app.post('/api/damage', ensureDriver, async (req, res) => {
  if (req.body && req.body.type === types.DISPATCH && ensureComplete([types.RETURN, types.DAMAGED, types.DELIVERED], req.body, accessLevel.ADMIN, req.body.createBy)) {
    return res.json({
      response: 'FAILED TO UPDATE DAMAGED ITEM',
    })
  }
  try {
    req.body.type = types.DAMAGED
    const transaction = new Transaction(types.DAMAGED, req.body, accessLevel.ADMIN, req.body.createBy, ).transaction
    blockchain.addBlock(blockchain.getChain(), transaction, accessLevel.ADMIN)
    updateCall()
    return res.json({
      response: 'ITEM DAMAGE MAY HAVE OCCURED',
      success: true,
    })
  } catch (e) {
    return res.json({
      response: 'FAILED TO UPDATE DAMAGED ITEM',
    })
  }
})
app.post('/api/attached', ensureSupplier, async (req, res) => {
  if (
    ensureComplete(
      [types.RETURN, types.ATTACHED, types.DISPATCH, types.DAMAGED, types.DELIVERED],
      req.body, accessLevel.ADMIN, req.body.createBy, )
  )
    return res.json({
      response: 'this item can no longer be sent',
    })
  try {
    // delete req.body.timestampc
    req.body.type = types.ATTACHED
    const transaction = new Transaction(
      types.ATTACHED,
      req.body,
      accessLevel.ADMIN,
      req.body.createBy,
    ).transaction
    blockchain.addBlock(
      blockchain.getChain(),
      transaction,
      accessLevel.ADMIN,
    )
    updateCall()
    return res.json({
      response: 'SENSOR ATTACHED',
      success: true,
    })
  } catch (e) {
    return res.json({
      response: 'Error with system try again',
      success: false,
    })
  }
})
/* Functions for testing */
const ensureComplete = function (type, data, access, user) {
  const recentPull = blockchain.getWorldState(access)
  const recentFilter = Object.keys(recentPull).map(k => recentPull[k])
  const quickTest = recentFilter
    .filter(item => item.createBy == user && item.code == data.code && item.timestamp == data.timestamp, )
  console.log(quickTest)
  if (quickTest.some(item => type.includes(item.type))) {
    return true
  }
  const filter = Object.keys(CHAIN).map(k => CHAIN[k])
  const chain = access === accessLevel.CUSTOMER ? filter.filter(item.access === accessLevel.CUSTOMER) : filter;
  // const transaction = new Transaction(type, data, access, user).transaction;
  return chain
    .filter(item => item.createBy == user && item.code == data.code && item.timestamp == data.timestamp, )
    .some(item => type.includes(item.type))
}
const updateLocal = function () {
  CHAIN = blockchain.viewChainContents(accessLevel.ADMIN)
  console.log('Updated admin Chain')
}
const updateCall = function () {
  request('http://localhost:8080/api/update', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      return body // Print the google web page.
    } else return error
  })
}

app.get('/api/block', ensureDataPull, async (req, res) => {
  return res.json(req.body)
})

app.get('/api/recentActivity', ensureRecentPull, async (req, res) => {
  return res.json(req.body)
})
CHAIN = blockchain.viewChainContents(accessLevel.ADMIN)
const httpServer = http.createServer(app);
httpServer.listen(process.env.PORT || 8080, () =>
  console.log('HTTP is running running'),
)