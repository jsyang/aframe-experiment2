/**
 * SocketIO server should mostly only act as a dumb pipe.
 */

var io = require('socket.io')(3001);
var os = require('os');

function onXY(s, a) {
    s.broadcast.emit('xy', a);
}

function onAngular(s, a) {
    s.broadcast.emit('angular', a);
}

function onTap(s, a) {
    s.broadcast.emit('tap', a);
}

function onGyronorm(s, a) {
    s.broadcast.emit('gyronorm', a);
}

function onNetworkAddressRequest(s, a) {
    var en0 = os.networkInterfaces()['en0'];

    var ipv4 = en0.filter(function (entry) {
        return entry.family === 'IPv4';
    })[0]['address'];

    s.emit('networkAddressResponse', ipv4);
}

function onConnection(socket) {
    socket
        .on('networkAddressRequest', onNetworkAddressRequest.bind(null, socket))
        .on('gyronorm', onGyronorm.bind(null, socket))
        .on('tap', onTap.bind(null, socket))
        .on('xy', onXY.bind(null, socket))
        .on('angular', onAngular.bind(null, socket));
}

io.on('connection', onConnection);