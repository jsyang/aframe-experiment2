var io = require('socket.io')(3001);


function onXY(a,b,c){
    console.log(a,b,c);
}

function onConnection(socket) {
    io.emit('this', { will: 'be received by everyone'});

    socket.on('xy', onXY);

    socket.on('disconnect', function () {
        io.emit('user disconnected');
    });
}

io.on('connection', onConnection);