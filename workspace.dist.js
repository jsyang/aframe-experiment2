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

},{"./network":1}]},{},[2]);
