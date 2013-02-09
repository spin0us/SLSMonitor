/******************************************************************
 * Author        : spin0us (github@spin0us.net)
 * Version       : node (>=0.8.18)
 * Description   : tools module
 * CreationDate  : 14:43 06/02/2013
 ******************************************************************/

function ipToHex(ip) {
    // +   original by: Spin0us (https://github.com/spin0us)
    // *     example 1: ipToHex('127.0.0.1');
    // *     returns 1: '7f000001'
    var hex = "",
        part = ip.split(".");
    for (var i = 0; i < 4; i++) {
        hex += hexZeroPadding(parseInt(part[i]).toString(16), 2);
    }
    return hex;
}

function hexToIp(hex) {
    // +   original by: Spin0us (https://github.com/spin0us)
    // *     example 1: hexToIp('7f000001');
    // *     returns 1: '127.0.0.1'
    return parseInt(hex.substring(0, 2), 16).toString() + "." +
           parseInt(hex.substring(2, 4), 16).toString() + "." +
           parseInt(hex.substring(4, 6), 16).toString() + "." +
           parseInt(hex.substring(6, 8), 16).toString();
}

function ord(string) {
    // source : http://phpjs.org/functions/ord/
    // http://kevin.vanzonneveld.net
    // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Onno Marsman
    // +   improved by: Brett Zamir (http://brett-zamir.me)
    // +   input by: incidence
    // *     example 1: ord('K');
    // *     returns 1: 75
    // *     example 2: ord('\uD800\uDC00'); // surrogate pair to create a single Unicode character
    // *     returns 2: 65536
    var str = string + "",
        code = str.charCodeAt(0);
    if (0xD800 <= code && code <= 0xDBFF) { // High surrogate (could change last hex to 0xDB7F to treat high private surrogates as single characters)
        var hi = code;
        if (str.length === 1) {
            return code; // This is just a high surrogate with no following low surrogate, so we return its value;
            // we could also throw an error as it is not a complete character, but someone may want to know
        }
        var low = str.charCodeAt(1);
        return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;
    }
    if (0xDC00 <= code && code <= 0xDFFF) { // Low surrogate
        return code; // This is just a low surrogate with no preceding high surrogate, so we return its value;
        // we could also throw an error as it is not a complete character, but someone may want to know
    }
    return code;
}

function dechex(number) {
    // source : http://phpjs.org/functions/dechex/
    // http://kevin.vanzonneveld.net
    // +   original by: Philippe Baumann
    // +   bugfixed by: Onno Marsman
    // +   improved by: http://stackoverflow.com/questions/57803/how-to-convert-decimal-to-hex-in-javascript
    // +   input by: pilus
    // *     example 1: dechex(10);
    // *     returns 1: 'a'
    // *     example 2: dechex(47);
    // *     returns 2: '2f'
    // *     example 3: dechex(-1415723993);
    // *     returns 3: 'ab9dc427'
    if (number < 0) {
        number = 0xFFFFFFFF + number + 1;
    }
    return parseInt(number, 10).toString(16);
}

function hexZeroPadding(str,size) {
    // +   original by: Spin0us (https://github.com/spin0us)
    // *     example 1: hexZeroPadding('f',2);
    // *     returns 1: 0f
    // *     example 2: hexZeroPadding('54af2',8);
    // *     returns 2: 00054af2
    return Array(size + 1 - str.length).join("0") + str;
}

function getCrc(str) {
    // +   original by: Spin0us (https://github.com/spin0us)
    // *     example 1: getCrc('013cb985ac14bca5ca261a0a');
    // *     returns 1: 'd2'
    var crc = 0;
    for (var i = 0, len = str.length; i < len; i++) {
        crc += ord(str.substring(i, i + 1));
    }
    return hexZeroPadding(dechex(crc % 256), 2);
}

/******************************************************************/

/*
 * Build the hexadecimal buffer for heartbeat
 *
 * @return: buffer
 */
exports.getHeartbeatBuffer = function (server) {
    var buf = "",
        now = new Date();
    buf += hexZeroPadding(now.getTime().toString(16), 12); // number of milliseconds since 1970/01/01
    buf += ipToHex(server.host); // config server host
    buf += hexZeroPadding(server.port.toString(16), 4); // config server port
    return new Buffer("bea7" + getCrc(buf) + buf, "hex");
};

/*
 * Parse recieved buffer to a structured json frame
 *
 * @param: buffer
 * @return: object
 */
exports.parseFrame = function (buffer) {
    var frame = Buffer.isBuffer(buffer) ? buffer.toString("hex") : buffer,
        parsed = {
            "head": frame.substring(0, 4),
            "crc" : frame.substring(4, 6)
        },
        chunk = frame.substring(6);

    // Compare crc
    if (getCrc(chunk) !== parsed.crc) {
        return null;
    }

    // Check header
    if (parsed.head !== "bea7") {
        return null;
    }
    
    parsed.date = parseInt(chunk.substring(0, 12), 16);
    parsed.server = {
        "host": hexToIp(chunk.substring(12, 20)),
        "port": parseInt(chunk.substring(20, 24), 16)
    };

    return parsed;

};