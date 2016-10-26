/**
 * SocketIO server should mostly only act as a dumb pipe.
 * Bugs:
 *   - robotjs fails to open a core graphics connection when run through Grunt
 */
var robot                 = require('robotjs');
var wdio                  = require('webdriverio');
var wdioElementScreenshot = require('wdio-element-screenshot');

var io = require('socket.io')(3001);
var os = require('os');

////////////////////////////////////////////////////////////////////////////////

// Broadcasts

function onKBMouse(s, a) {
    console.log(a);
    s.broadcast.emit('kbmouse', a);
}

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

////////////////////////////////////////////////////////////////////////////////

// Return to sender

function onNetworkAddressRequest(s, a) {
    var en0 = os.networkInterfaces()['en0'];

    var ipv4 = en0.filter(function (entry) {
        return entry.family === 'IPv4';
    })[0]['address'];

    s.emit('networkAddressResponse', ipv4);
}

////////////////////////////////////////////////////////////////////////////////

// WebdriverIO

var WDIO_REMOTE_CLIENT_SETTINGS = {
    desiredCapabilities : { browserName : 'chrome' },
    singleton           : true
};

var wdioClients = {};

function onWDIOClientRequestFulfilled() {
    this.emit('wdioClientResponse', Array.prototype.slice.call(arguments));
}

function onWDIOClientRequest(s, a) {
    console.log(a);

    var client = wdioClients[a.clientId];

    if (!client) {
        wdioClients[a.clientId] = wdio.remote(WDIO_REMOTE_CLIENT_SETTINGS);
        client                  = wdioClients[a.clientId];
        wdioElementScreenshot.init(client);
    }

    if (a.requestType === 'init') {
        client
            .init()
            .call(onWDIOClientRequestFulfilled.bind(s));
    } else if (a.requestType === 'setViewportSize') {
        client
            .setViewportSize(a.requestValue)
            .call(onWDIOClientRequestFulfilled.bind(s));
    } else if (a.requestType === 'url') {
        client
            .url(a.requestValue)
            .call(onWDIOClientRequestFulfilled.bind(s));
    } else if (a.requestType === 'end') {
        client
            .end()
            .call(onWDIOClientRequestFulfilled.bind(s));
    } else if (a.requestType === 'screenshot') {
        client
            .saveScreenshot()
            .then(
                function (buffer) {
                    onWDIOClientRequestFulfilled.call(s, 'screenshot', buffer.toString('base64'));
                }
            );
    } else if (a.requestType === 'elementScreenshot') {
        client
            .takeElementScreenshot(a.requestValue)
            .then(function (buffer) {
                onWDIOClientRequestFulfilled.call(s, 'elementScreenshot', buffer.toString('base64'));
            });
    }
}

////////////////////////////////////////////////////////////////////////////////

// RobotJS

function generateBufferDiff(oldBuffer, newBuffer) {
    var diffBuffer = Buffer.alloc(oldBuffer.length);
    for (var i = 0; i < oldBuffer.length; i++) {
        if (newBuffer[i] != oldBuffer[i]) {
            diffBuffer[i] = newBuffer[i];
        }
    }

    return diffBuffer;
}

function decimateBufferImagePixels(buffer, factor) {
    var maxI            = buffer.length / factor / factor;
    var decimatedBuffer = Buffer.alloc(maxI);
    for (var i = 0; i < maxI; i++) {
        var j = i * factor;

        decimatedBuffer[i]     = buffer[j];
        decimatedBuffer[i + 1] = buffer[j + 1];
        decimatedBuffer[i + 2] = buffer[j + 2];
        decimatedBuffer[i + 3] = buffer[j + 3];
    }
    return decimatedBuffer;
}

// This is as good as it's going to get without compression. Ideally, we'd use UDP
// but since we can't do that here, this is the next best thing :(

function onRobotJSRequest(s, a) {
    if (a.requestType === 'screenshot') {
        console.log('RobotJS screenshot requested', new Date());

        s.sendBuffer = [];

        var i = robot.screen.capture();

        if (s.hasSentInitialRequest) {
            //var newDecimatedBuffer = decimateBufferImagePixels(i.image, 2);
            var diff = generateBufferDiff(s.initBuffer, i.image);
            //var diff     = generateBufferDiff(s.initBuffer, i.image);
            //s.initBuffer           = newDecimatedBuffer;
            //s.initBuffer = i.image;
            s.emit('robotJSScreenshotDiff', diff);
        } else {
            //s.initBuffer            = decimateBufferImagePixels(i.image, 2);
            s.initBuffer            = i.image;
            s.hasSentInitialRequest = true;
            //s.emit('robotJSScreenshotInit', s.initBuffer, i.width / 2, i.height / 2);
            s.emit('robotJSScreenshotInit', s.initBuffer, i.width, i.height);
        }

    }
}

////////////////////////////////////////////////////////////////////////////////

// Entry point

function onConnection(socket) {
    socket
        .on('gyronorm', onGyronorm.bind(null, socket))
        .on('tap', onTap.bind(null, socket))
        .on('kbmouse', onKBMouse.bind(null, socket))
        .on('xy', onXY.bind(null, socket))
        .on('angular', onAngular.bind(null, socket))

        .on('networkAddressRequest', onNetworkAddressRequest.bind(null, socket))
        .on('robotJSRequest', onRobotJSRequest.bind(null, socket))
        .on('wdioClientRequest', onWDIOClientRequest.bind(null, socket));
}

io.on('connection', onConnection);