const express = require('express')
const http = require('http')
const app = express()
// const bcrypt = require('bcrypt')
const bodyParser = require('body-parser')
const session = require('express-session')

const File = require('./writeData.js')
const file = new File()
const ITEMLIST = 'items.json'
const NAVLINKS = 'links.json'
let CHAIN = undefined
var rp = require('request-promise')
var request = require('request')
app.use(express.static('public'))
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
)
const hosts = {
  backend: `http://188.166.151.163:9000`,
  chain: `http://188.166.151.163:9002`,
  miner: `http://188.166.151.163:9003`,
  items: `http://188.166.151.163:3001`,
  accounts: `http://188.166.151.163:5000`,
}
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

/////
///// Sessions
/////
const sessionCheck = function(req, res, next) {
  if (req.session.user) {
    req.body.accessLevel = req.session.user.user_account
    req.body.user_email = req.session.user.user_email
    return next()
  }
  return res.redirect('/login')
}
const setPriviligeCustomer = function(req, res, next) {
  req.body.privilge = accessLevel.CUSTOMER
  next()
}
const setPriviligeAdmin = function(req, res, next) {
  req.body.privilge = accessLevel.ADMIN
  next()
}

const supplierAdd = function(req, res, next) {
  const {code, name , item} = req.body;
  if( !code ) 
    return next(err);
  delete req.body.code;
  delete req.body.name;
  delete req.body.item;
  req.body.id = "Items"
  req.body.timestamp = new Date().toGMTString();
  req.body.type = !name ? `REMOVED ITEM ${code}` : `ADD ITEMS ${code}`
  req.body.data = { code, name , item};
  next();
}
const returnChain = async function() {
  let result = await rp(`${hosts.miner}/getChain`)
    .then((result) => JSON.parse(result))
    .catch((err) => err)
  return Object.keys(result).map(k => result[k])
}
const sendRequest = async function(req, res, next) {
  console.log(req.body)
  var options = {
    method: 'POST',
    uri: `${hosts.backend}${req.url}`,
    body: req.body,
    json: true, // Automatically parses the JSON string in the response
  }
  const send = await rp(options)
    .then(res => res)
    .catch(err => err)
  if (send.success) 
    return next()
  return res.json({
    response: 'Failed' || send.err,
  })
}
const filterChain = async function (list) {
  let map = await returnChain()
  map = map.filter(k => !isNaN(k.id))
  let ignores = [];
  let keep = {};
  map.forEach(k => {
    keep[k.id] = "used";
    if (ignores.includes(k.id))
      delete keep[k.id] 
    if (list.includes(k.type)) {
      ignores.push(k.id);
      delete keep[k.id] 
    }
  })
  console.log(keep, ignores)
  return map.filter(x => Object.keys(keep).includes(x.id))
}
///
/// Links
///
app.get('/api/links', async (req, res) => {
  const itemList = JSON.parse(file.read(NAVLINKS))
  if (req.session.user) {
    if (req.session.user.user_account == accessLevel.ADMIN) return res.json(itemList.admin)
    if (req.session.user.user_account == accessLevel.SUPPLIER) return res.json(itemList.supplier)
    if (req.session.user.user_account == accessLevel.DRIVER) return res.json(itemList.driver)
    return res.json(itemList.customer)
  }
  res.json(itemList.loggedOut)
})
app.get('/api/attach', async (req, res) => {
  return res.json(await filterChain(
    ["RETURN","DELIVERED","ATTACHED","DELETE", "DISPATCH", "INSERT", "UPDATE"]))
})
app.get('/api/dispatched', async  (req, res) => {

  return res.json(await filterChain(["RETURN", "DELIVERED"]))
})
app.post('/api/checkItem', (req, res) => {
  const customer = Object.values(CHAIN)
  return res.json(customer.filter(x => x.timestamp == req.body.timestamp))
})

app.post('/register', async (req, res) => {
  console.log(req.body)
  const {user_email, user_name, user_password} = req.body
  if (!req.body.user_account) req.body.user_account = accessLevel.CUSTOMER
  var options = {
    method: 'POST',
    uri: `${hosts.accounts}/register`,
    body: {
      user_email,
      user_name,
      user_password,
      user_type: req.body.user_account,
    },
    json: true, // Automatically parses the JSON string in the response
  }

  const accountCreated = await rp(options)
    .then((res) => res )
    .catch((err)  =>  err )
  if (accountCreated.success) 
    return res.json({
      response: "User added"
    })
  return res.json({ response : "Error"})
})
app.post('/login', async (req, res) => {
  const {user_email, user_password} = req.body
  var options = {
    method: 'POST',
    uri: `${hosts.accounts}/login`,
    body: {
      user_email,
      user_password,
    },
    json: true, // Automatically parses the JSON string in the response
  }

  const response = await rp(options)
    .then((res) => res)
    .catch((err) => err )
  console.log(response)
  if (response.success) {
    req.session.user = response.success
    return res.redirect('/home')
  }
  return res.redirect('/login')
})

app.post('/supplier/add', sessionCheck, setPriviligeAdmin, supplierAdd, sendRequest, (req, res, next) => {
  res.redirect('/home')
})
app.post('/supplier/remove', sessionCheck, setPriviligeAdmin, supplierAdd, sendRequest, (req, res, next) => {
  return res.redirect('/home')
})

/********************************************
 * ROUTES
 *******************************************/
app.get('/logout', (req, res) => {
  req.session.user = undefined
  res.redirect('/login')
})

app.get('/', async (req, res) => {
  res.redirect('/home')
})
app.get('/home', sessionCheck, async (req, res) => {
  if (req.session.user.user_account == accessLevel.CUSTOMER) return res.redirect('/homePage.html')
  return res.redirect('/home.html')
})
app.get('/login', async (req, res) => {
  res.redirect('/login.html')
})
app.get('/register', async (req, res) => {
  res.redirect('/register.html')
})
app.get('/orders', sessionCheck, async (req, res) => {
  res.redirect('/viewOrders.html')
})
app.get('/delivery', sessionCheck, async (req, res) => {
  res.redirect('/viewDelivery.html')
})
app.get('/view', async (req, res) => {
  if (req.session.user) {
    if (
      req.session.user.user_account == accessLevel.ADMIN ||
      req.session.user.user_account == accessLevel.SUPPLIER ||
      req.session.user.user_account == accessLevel.DRIVER
    )
      return res.redirect('/viewAdmin.html')
    return res.redirect('/viewchain.html')
  }
  res.redirect('/login')
})
app.get('/account', sessionCheck, async (req, res) => {
  return res.redirect('/account.html')
})
app.get('/api/account', sessionCheck, async (req, res) => {
  return res.json(req.session.user)
})
app.get('/api/items', async (req, res) => {
  const check = await rp(`${hosts.items}/getAll`)
    .then((result) => res.json(JSON.parse(result)) )
    .catch((err) => res.json(err) )
 // console.log(check)
})
app.get('/supplier/items', sessionCheck, (req, res) => {
  return res.redirect('/addItem.html')
})
app.get('/admin/register', sessionCheck, (req, res) => {
  return res.redirect('/registerParticpant.html')
})
app.get('/api/update', (req, res) => {
  res.json(JSON.parse(file.read(ITEMLIST)))
})
/*
 Changing an Items status 
*/
app.post('/api/items', async (req, res) => {
  res.json(JSON.parse(file.read(ITEMLIST)))
})
app.post('/api/order', sessionCheck, setPriviligeCustomer, sendRequest, async (req, res) => {
  return res.json({
    response: 'item sent',
  })
})
app.post('/api/return', sessionCheck, setPriviligeCustomer, sendRequest, async (req, res) => {
  return res.json({
    response: 'item returned',
  })
})
app.post('/api/dispatch',  setPriviligeCustomer, sendRequest, async (req, res) => {
  return res.json({
    response: 'ITEM SENT',
    success: true,
  })
})
app.post('/api/delivery',  setPriviligeCustomer, sendRequest, async (req, res) => {
  return res.json({
    response: 'ITEM DELIVERED',
    success: true,
  })
})
app.post('/api/damage',  setPriviligeAdmin, sendRequest,  async (req, res) => {
  return res.json({
    response: 'ITEM DAMAGE MAY HAVE OCCURED',
    success: true,
  })
})
app.post('/api/attached',  setPriviligeAdmin, sendRequest,  async (req, res) => {
  
  return res.json({
    response: 'SENSOR ATTACHED',
    success: true,
  })

})
app.get('/api/block' , sessionCheck , async (req, res) => {
  result = await returnChain()
  console.log("here", result)
  if(req.session.user.user_account == accessLevel.CUSTOMER)
      return res.json(result.filter(k => k.user_email == req.session.user.user_email && k.privilge == accessLevel.CUSTOMER));
  return res.json(result)
   
})

const httpServer = http.createServer(app)
httpServer.listen(process.env.PORT || 8080, () => console.log('HTTP is running running'))
