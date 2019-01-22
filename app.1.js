const express = require('express')
const http = require('http')
const app = express()
const bcrypt = require('bcrypt')
var bodyParser = require('body-parser')
app.use(express.static('public'))
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
)
app.use(bodyParser.json())
const chainCode = []
const keys = []

var request = require('request');

const compare = function () {
  const result = await new Promise(function (respond, reject) {
    request('http://localhost:8080/getHash', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        respond(body) // Print the google web page.
      } else
        reject(error)
    })
  });
}
app.post('/addBlock', async (req, res) => {
  console.log('here')
  res.json(req.body.data)
  const result = await new Promise(function (respond, reject) {
    request('http://localhost:8080/pullKey', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        respond(body) // Print the google web page.
      } else
        reject(error)
    })
  });
  console.log(result);
  const result2 = await new Promise(function (respond, reject) {
    console.log(result)
    request.post({
      url: 'http://localhost:8080/getChainCode',
      body: {
        key: result
      },
      json: true
    }, function (error, response, body) {
      respond(body);
    });
  })
  console.log(result2);
})

const httpServer = http.createServer(app)

httpServer.listen(process.env.PORT || 8081, () =>
  console.log('Second server running'),
)