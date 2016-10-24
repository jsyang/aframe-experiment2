var network = require('./network');

var EL = {
    wdioClientScreen1 : null
};

////////////////////////////////////////////////////////////////////////////////

// WebdriverIO Client Responses

function onWDIOClientResponse(res) {
    console.log('wdioClientResponse', res);

    if (res[0] === 'screenshot') {

    }
}

function updateClientScreen1() {
    EL.wdioClientScreen1.setAttribute(
        'material', 'src', 'url(screenshot.jpg?' + (+new Date()) + ')'
    );
}

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

function initNetwork() {
    network
        .init({
            useSocketIO : true,
            url         : location.protocol + '//' + location.hostname + ':3001'
        })
        .on('robotJSScreenshot', onRobotJSScreenshot)
        .on('wdioClientResponse', onWDIOClientResponse);
}

////////////////////////////////////////////////////////////////////////////////

// Entry point

function onDOMContentLoaded() {
    // Run all values as selectors and save in place
    Object.keys(EL).forEach(function (k) { EL[k] = document.getElementById(k);});

    initNetwork();
    setInterval(sendScreenshotRequest, 300);
}

document.addEventListener('DOMContentLoaded', onDOMContentLoaded);

// debug stuff

function sendScreenshotRequest() {
    network.emit('robotJSRequest', { requestType : 'screenshot' });
}

function sendWDIORequest(req) {
    network.emit('wdioClientRequest', req);
}

window.r = sendWDIORequest;

window.req1 = sendWDIORequest.bind(null, {
    requestType  : 'init',
    clientId     : 'abc',
    requestValue : true
});

window.req2 = sendWDIORequest.bind(null, {
    requestType  : 'setViewportSize',
    clientId     : 'abc',
    requestValue : { width : 800, height : 600 }
});

window.req3 = function (url) {
    sendWDIORequest({
        requestType  : 'url',
        clientId     : 'abc',
        requestValue : url
    });
};

window.req4 = sendWDIORequest.bind(null, {
    requestType  : 'screenshot',
    clientId     : 'abc',
    requestValue : true
});

window.req5 = sendWDIORequest.bind(null, {
    requestType  : 'end',
    clientId     : 'abc',
    requestValue : true
});
