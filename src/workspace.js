var network = require('./network');

var EL = {
    scene             : null,
    wdioClientScreen1 : null,
    wdioClientScreen2 : null,
    wdioClientScreen3 : null
};

////////////////////////////////////////////////////////////////////////////////

// Mouse interaction

var ctx2d;
var inputCanvasComponent;
var CENTERX = 256;
var CENTERY = 256;

var xPoints = [];
var yPoints = [];

function onXY(res) {
    if (!ctx2d) {
        inputCanvasComponent = EL.inputCanvas.components["canvas-material"];
        ctx2d                = inputCanvasComponent.getContext();
        ctx2d.strokeStyle    = '#ffff00';
        ctx2d.lineWidth      = 20;
        ctx2d.lineCap        = "round";
    }

    if (res.isEnd) {
        xPoints = [];
        yPoints = [];
    } else {
        xPoints.push(CENTERX + res.dx * 0.5);
        yPoints.push(CENTERY + res.dy * 0.5);
    }

    drawPointsToCanvas();

}

function drawPointsToCanvas() {
    ctx2d.clearRect(0, 0, 512, 512);
    ctx2d.beginPath();
    ctx2d.moveTo(256, 256);
    for (var i = 0; i < xPoints.length; i++) {
        ctx2d.lineTo(xPoints[i], yPoints[i]);
    }
    ctx2d.stroke();
    inputCanvasComponent.updateTexture();
}

////////////////////////////////////////////////////////////////////////////////

// WebdriverIO Client Responses

function onWDIOClientResponse(res) {
    console.log('wdioClientResponse', res);

    if (res[0] === 'screenshot') {
        EL.wdioClientScreen1.setAttribute(
            'material', 'src', 'url(screenshot.png?' + new Date() + ')'
        );
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
        .on('wdioClientResponse', onWDIOClientResponse);
}

////////////////////////////////////////////////////////////////////////////////

// Entry point

function onDOMContentLoaded() {
    // Run all values as selectors and save in place
    Object.keys(EL).forEach(function (k) { EL[k] = document.getElementById(k);});

    initNetwork();
}

document.addEventListener('DOMContentLoaded', onDOMContentLoaded);

// debug stuff

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

window.req3 = sendWDIORequest.bind(null, {
    requestType  : 'url',
    clientId     : 'abc',
    requestValue : 'http://reddit.com'
});

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
