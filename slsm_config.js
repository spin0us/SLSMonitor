/******************************************************************
 * Author        : spin0us (github@spin0us.net)
 * Version       : node (>=0.8.18)
 * Description   : configuration mobule
 * CreationDate  : 13:49 07/02/2013
 ******************************************************************/

var fs = require("fs"),
    interfaces = require('os').networkInterfaces(),
    addresses = [], // Store local public ip address

    CONFIGURATION_FILENAME = "./config.json", // Configuration file name
    DEFAULT_PORT = 6666, // Default udp port number
    DEFAULT_URL = "http://www.google.com"; // Default web test url

function storeConfig(data) {
    // +   original by: Spin0us (https://github.com/spin0us)
    fs.writeFile(CONFIGURATION_FILENAME, JSON.stringify(data), function (err) {
        if (err) console.log(err);
    });
}

function index_of(haystack, needle) {
    // +   original by: Spin0us (https://github.com/spin0us)
    for (var i = 0, l = haystack.length; i < l; ++i) {
        if (haystack[i].host === needle) {
           return i;   
        }
    }
    return -1;
}

/******************************************************************/

exports.data = {
    "listen": DEFAULT_PORT,
    "weburl": DEFAULT_URL,
    "server": []
};

/*
 * Load configuration file in data variable
 */
exports.loadConfig = function () {

    // Check configuration file existence in synchronous way
    if (fs.existsSync(CONFIGURATION_FILENAME)) {
        try {
            this.data = JSON.parse(fs.readFileSync(CONFIGURATION_FILENAME, "utf8"));
        } catch (e) {
            console.log(e);
        }
    }

    // Check missing required elements
    if (typeof(this.data.listen) === "undefined") this.data.listen = DEFAULT_PORT;

    // Build local public ip address array
    for (k in interfaces) {
        for (k2 in interfaces[k]) {
            var address = interfaces[k][k2];
            if (address.family == "IPv4" && !address.internal) {
                addresses.push(address.address)
            }
        }
    }

};

/*
 * Load configuration file in data variable
 *
 * @param: object ({"host":___, "port":___})
 * @param: object ({"host":___, "port":___})
 */
exports.addToConfig = function (remote, server) {

    // Check if remote already in configuration store
    if (index_of(this.data.server, remote.address) === -1) {
        this.data.server.push({
            "host":remote.address,
            "port":remote.port
        });
        storeConfig(this.data);
    }

    // Check if server is this one
    if (addresses.indexOf(server.host) === -1) {
        // Check if server addon already in configuration store
        if (index_of(this.data.server, server.host) === -1) {
            this.data.server.push({
                "host":server.host,
                "port":server.port
            });
            storeConfig(this.data);
        }
    }

};
