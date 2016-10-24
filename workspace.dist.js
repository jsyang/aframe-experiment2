(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var useSocketIO = false;
var useFirebase = false;

/**
 * @constant
 * @type {{apiKey: string, authDomain: string, databaseURL: string, storageBucket: string, messagingSenderId: string}}
 */
var FIREBASE_CONFIG = {
    apiKey            : "AIzaSyCLebbgoiWvHZRjlfaypKfaRLQr8QKrgxI",
    authDomain        : "vr-controller.firebaseapp.com",
    databaseURL       : "https://vr-controller.firebaseio.com",
    storageBucket     : "vr-controller.appspot.com",
    messagingSenderId : "296551941581"
};

var firebaseRef;
var firebaseDeviceId;

/**
 * @param {object} options
 * @param {Boolean} [options.useSocketIO]
 * @param {Boolean} [options.useFirebase]
 * @param {string} [options.url]
 * @param {string} [options.deviceId]
 * @returns {*}
 */
function init(options) {
    useFirebase = options.useFirebase;
    useSocketIO = options.useSocketIO;

    if (useSocketIO) {
        window.socket = io(options.url);
        return window.socket;

    } else if (useFirebase) {
        window.firebase.initializeApp(FIREBASE_CONFIG);

        firebaseDeviceId = options.deviceId;
        firebaseRef      = window.firebase.database().ref('sessions/' + firebaseDeviceId);
        return firebaseRef;
    }
}

/**
 * @param {string} eventName
 * @param {*} eventValue
 */
function emit(eventName, eventValue) {
    if (useSocketIO) {
        window.socket.emit(eventName, eventValue);
    } else if (useFirebase) {
        firebaseRef.set({
            eventName  : eventName,
            eventValue : eventValue
        });
    }
}

/**
 * @param {string} eventName
 * @param {function} eventHandlerFunc
 * @returns {*}
 */
function on(eventName, eventHandlerFunc) {
    if (useSocketIO) {
        window.socket.on(eventName, eventHandlerFunc);
        return window.socket;
    } else if (useFirebase) {
        firebaseRef.on(eventName, eventHandlerFunc);
        return firebaseRef;
    }
}

module.exports = {
    init : init,
    emit : emit,
    on   : on
};
},{}],2:[function(require,module,exports){
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

},{"./network":1}]},{},[2]);
