var io = require('socket.io')(3001);

function onXY(s, a) {
    s.broadcast.emit('xy', a);
}

function onAngular(s, a) {
    s.broadcast.emit('angular', a);
}

function onConnection(socket) {
    socket
        .on('xy', onXY.bind(null, socket))
        .on('angular', onAngular.bind(null, socket));
}

io.on('connection', onConnection);