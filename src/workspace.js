var network = require('./network');

var EL = {
    wdioClientScreen1 : null
};

////////////////////////////////////////////////////////////////////////////////

// Canvas material boilerplate

function drawImage(i) {
    if (!ctx2d) {
        canvasMaterialComponent = EL.wdioClientScreen1.components["canvas-material"];
        ctx2d                   = canvasMaterialComponent.getContext();
    }

    ctx2d.drawImage(i, 0, 0, 800, 600);
    canvasMaterialComponent.updateTexture();
}

////////////////////////////////////////////////////////////////////////////////

// WebdriverIO Client Responses

function onWDIOClientResponse(res) {
    console.log('wdioClientResponse');

    if (res) {
        if (res[0] === 'elementScreenshot' || res[0] === 'screenshot') {
            var dataURI = 'data:image/png;base64,' + res[1];
            var img     = new Image();
            img.onload  = drawImage.bind(null, img);
            img.src     = dataURI;
        }

        executeNextWDIOCommand();
    }
}

////////////////////////////////////////////////////////////////////////////////

// RobotJS Client Responses

var ctx2d;
var canvasMaterialComponent;

var SCREEN_WIDTH  = 1280 * 2;
var SCREEN_HEIGHT = 800 * 2;

function onRobotJSScreenshot(buffer) {
    console.log('buf recvd');
    if (ctx2d) {
        var imageData = new ImageData(new Uint8ClampedArray(buffer), SCREEN_WIDTH, SCREEN_HEIGHT);
        ctx2d.putImageData(imageData, 0, 0);
        canvasMaterialComponent.updateTexture();
    } else {
        canvasMaterialComponent = EL.wdioClientScreen1.components["canvas-material"];
        ctx2d                   = canvasMaterialComponent.getContext();
    }

}

////////////////////////////////////////////////////////////////////////////////

// Network
var networkCommandQueue = [];

function executeNextWDIOCommand() {
    var nextCommand = networkCommandQueue.shift();
    if (nextCommand) {
        network.emit('wdioClientRequest', nextCommand);
    }
}

function initNetwork() {
    network
        .init({
            useSocketIO : true,
            url         : location.protocol + '//' + location.hostname + ':3001'
        })
        .on('robotJSScreenshot', onRobotJSScreenshot)
        .on('wdioClientResponse', onWDIOClientResponse);

    networkCommandQueue = [
        { clientId : 'abc', requestType : 'init' },
        { clientId : 'abc', requestType : 'setViewportSize', requestValue : { width : 800, height : 600 } },
        { clientId : 'abc', requestType : 'url', requestValue : 'https://en.m.wikipedia.org/wiki/Virtual_reality' },
        { clientId : 'abc', requestType : 'screenshot', requestValue : '' },
        { clientId : 'abc', requestType : 'end' }
    ];

    executeNextWDIOCommand();
}

////////////////////////////////////////////////////////////////////////////////

// Entry point

function onDOMContentLoaded() {
    // Run all values as selectors and save in place
    Object.keys(EL).forEach(function (k) { EL[k] = document.getElementById(k);});

    initNetwork();
    //setInterval(sendScreenshotRequest, 600);
}

document.addEventListener('DOMContentLoaded', onDOMContentLoaded);

// debug stuff

function sendScreenshotRequest() {
    network.emit('robotJSRequest', { requestType : 'screenshot' });
}