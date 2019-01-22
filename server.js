const net = require('net');
const dgram = require('dgram');
const ip = require("ip");
const blockchain = require('./chainSetup.js');
const ipAddress = ip.address();
const PORT = 6024;

var udp = dgram.createSocket("udp4");
var clients = [];
const connectionDetails = {
  PORT: 1337,
  ipAddress,
  key: undefined
}
const connections = [];
const MESSAGETYPE = {
  MESSAGE: 'MESSAGE',
  BLOCKCHAINREQ: 'BLOCKREQ',
  BLOCKCHAINRES: 'BLOCKRES',


}





udp.on('listening', function () {
  var address = udp.address();
  console.log('UDP Client listening on ' + address.address + ":" + address.port);
  udp.setBroadcast(true);
});

udp.on('message', function (message, rinfo) {
  console.log('Message from: ' + rinfo.address + ':' + rinfo.port + ' - ' + message);
  connectionDetails.key = Math.floor(Math.random() * (99999 - 10000) + 10000);
  console.log("key ", connectionDetails.key)
  udp.send(JSON.stringify(connectionDetails), rinfo.port, rinfo.address, (err) => {
    //client.close();
  });
  connections.push(connectionDetails.key.toString());
  connectionDetails.key = undefined;
});

udp.bind(PORT);

var server = net.createServer(function (connection) {

  console.log('client connected');
  console.log(connection.localAddress)
  console.log(connection.remotePort)
  connection.name = connection.remoteAddress + "::" + connection.remotePort

  connection.on('data', function (data) {
    const clientIndex = clients.map(x => x.name).indexOf(connection.name);
    if (clientIndex > -1) {
      const response = JSON.parse(data.toString());

      if (response.MESSAGE)
        broadcast(`${connection.name}> ${response.body} \n`, connection);
      if (response.BLOCKCHAINREQ) {
        broadcast(`${connection.name}> ########## BLOCKCHAIN REQUEST ########\n`, connection);
        connection.write(JSON.stringify(blockchain.getChain()));
      }

    } else {
      const keyIndex = connections.indexOf(data.toString());
      if (keyIndex > -1) {
        broadcast(connection.name + "> Joined the server\n", connection);
        clients.push(connection);
      } else {
        broadcast(connection.name + "> Failed to join\n", connection);
        connection.destroy();
      }
    }

  });

  // broadcast(connection.name + " joined the chat\n", connection);
  connection.write('Welcome !\r\n');
  connection.pipe(connection);
  //Prevents server downfall
  connection.on("error", (err) => {
    console.log("Caught flash policy server socket error: ");
    clients = clients.filter(connect => connect.name != connection.name);
    broadcast(connection.name + "> left the server\n", connection);
  })
  connection.on('end', function () {
    console.log('client disconnected');
    // const clientIndex = clients.map(x => x.name).indexOf(connection.name);
    clients = clients.filter(connect => connect.name != connection.name);
    broadcast(connection.name + "> left the server\n", connection);
  });

  function broadcast(message, sender) {
    clients.forEach(function (client) {
      // Don't want to send it to sender
      if (client === sender) return;
      client.write(message);
    });
    // Log it to the server output too
    process.stdout.write(message)
  }
});

server.listen(1337, function () {
  console.log('server is listening');
});