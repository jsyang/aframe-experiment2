var io = require('socket.io')(3001);

function onXY(a) {
    console.log(a);
}

function onAngular(s, a) {
    console.log(a);
    s.broadcast.emit('angular', a);
}

function onConnection(socket) {
    socket
        .on('xy', onXY)
        .on('angular', onAngular.bind(null, socket))
}

io.on('connection', onConnection);