var net = require('net');
const dgram = require('dgram');
const ip = require("ip");

const PORT = 6024;
var BROADCAST_ADDR = "192.168.1.255";
console.log(ip.address())
let connected = false;
const udp = dgram.createSocket("udp4");
const encryptionKey = Math.floor(Math.random() * (99999 - 10000) + 10000);

let client = undefined;
// net.connect({
//   port: 1337,
//   host: '192.168.1.88'
// }, function () {
//   console.log('connected to server!');
// });
// client.on('data', function (data) {
//   console.log(data.toString());
//   // client.end();
// });

udp.bind(function () {
  udp.setBroadcast(true);
  setInterval(UDPbroadcast, 1000);
});
udp.on('message', function (message, rinfo) {
  console.log(`Connection details from ${rinfo.address}:${rinfo.port} -  ${message}`);

  if (!connected) {
    const connectionDetails = JSON.parse(message);
    client = net.connect({
      port: connectionDetails.PORT,
      host: connectionDetails.ipAddress
    }, function () {
      console.log('Connected to server!');
    });
    // sendMessage();
    client.on('data', function (data) {

      console.log(data.toString());
      // client.end();
    });
    client.write(connectionDetails.key + "");

    client.on('end', function () {
      console.log('disconnected from server');
    });
  }
  connected = message;
});

function sendMessage() {
  const data = {
    BLOCKCHAINREQ: 'HERE',
    body: 'Hello'
  };
  client.write(JSON.stringify(data));
}

function UDPbroadcast() {
  if (connected) {
    clearInterval(this);
  } else {
    var message = new Buffer("Searching for server");
    udp.send(message, 0, message.length, PORT, BROADCAST_ADDR, function () {
      console.log("Sent '" + message + "'");
    });
  }

}