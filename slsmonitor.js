/******************************************************************
 * Author        : spin0us (github@spin0us.net)
 * Version       : node (>=0.8.18)
 * Description   : server monitoring
 * CreationDate  : 13:59 06/02/2013
 ******************************************************************
 * Heartbeat frame     : bea7[crc/2][datetime/10][ip/8][port/4] (size:28)
 ******************************************************************/

// Required modules
var tools = require("./tools"),
    config = require("./slsm_config"),
    dgram = require("dgram"),
    sindex = 0; // Rolling index of config server

// Load configuration
config.loadConfig();

// Init udp socket
var socket = dgram.createSocket("udp4");

// Server listening on public address
socket.on("listening", function () {
    var address = socket.address();
    console.log("UDP Server listening on " + address.address + ":" + address.port);
});

socket.on("message", function (message, remote) {
    var frame = tools.parseFrame(message);
    if (frame !== null) {
        config.addToConfig(remote, frame.server);
        console.log("Tick from " + remote.address + ":" + remote.port + " ", message.toString("hex"));
    }
});

// Start listening server
socket.bind(config.data.listen);

// Start UDP heartbeat process
(function udpHeartbeatThread () {
    var len = config.data.server.length;
    if (len > 0) {
        sindex = (sindex <= 0 ? len - 1 : sindex - 1);
        var buffer = tools.getHeartbeatBuffer(config.data.server[sindex]);
        for (var i = 0; i < len; i++) {
            var target = config.data.server[i];
            socket.send(buffer, 0, buffer.length, target.port, target.host, function (err, bytes) {
                if (err) {
                    console.log("UDP error sending to " + target.host + ":" + target.port, err);
                }
            });
        }
    }
    setTimeout(udpHeartbeatThread, 5000);
}) ();

// Start HTTP heartbeat process
(function httpHeartbeatThread () {
    http.get(config.data.weburl, function(res) {
        console.log("Got response: " + res.statusCode);
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });
    setTimeout(udpHeartbeatThread, 5000);
}) ();
