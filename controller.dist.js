(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var network = require('./network');

var inputXY       = require('./inputXY');
var inputGyronorm = require('./inputGyronorm');
var getHashId     = require('./getHashId');

var isConnected = false;

function connect() {
    network
        .init({
            useSocketIO : true,
            url         : "http://localhost:3001"
        })
        .on('connect', setConnectedStatus);

    $('#deviceMode').innerHTML = DEVICE_MODE;

    if (DEVICE_MODE === 'gyronorm') {
        inputGyronorm.init(network);
    } else if (DEVICE_MODE === 'xy') {
        inputXY.init(network);
    }
}

var EL = {
    deviceId        : null,
    deviceMode      : null,
    networkMode     : null,
    networkStatus   : null,
    openControlArea : null
};

// Device id

function updateDeviceId() {
    var id = getHashId();
    localStorage.setItem('deviceId', id);
    return id;
}

function getDeviceId() {
    var id = localStorage.getItem('deviceId');
    if (!id || id === 'null') {
        id = updateDeviceId();
    }
    return id;
}

// Device mode

function updateDeviceMode(mode) {
    if (/xy|gyronorm/.test(mode)) {
        localStorage.setItem('deviceMode', mode);
    } else {
        localStorage.setItem('deviceMode', 'xy');
    }
}

function getDeviceMode() {
    var mode = localStorage.getItem('deviceMode');
    if (!mode || mode === 'null') {
        mode = updateDeviceMode('xy');
    }
    return mode;
}

function getNetworkMode() {
    return 'socketio';
}

function getNetworkStatus() {
    return isConnected ? 'connected' : 'not connected';
}

function updateTable() {
    EL.deviceId.value    = getDeviceId();
    EL.deviceMode.value  = getDeviceMode();
    EL.networkMode.value = getNetworkMode();

    EL.networkStatus.value     = getNetworkStatus();
    EL.networkStatus.className = isConnected ? 'green' : 'red';
}

function onConnect() {
    isConnected = true;
    updateTable();
}

function onReconnectFailed(){
    isConnected = false;
    updateTable();
}

function onConnectError(){
    isConnected = false;
    EL.networkStatus.className = 'yellow';
}

function initNetwork() {
    network
        .init({
            useSocketIO : true,
            url         : "http://localhost:3001"
        })
        .on('connect', onConnect)
        .on('connect_error', onConnectError)
        .on('reconnect_failed', onReconnectFailed);
}

function initInput() {
    ({
        xy       : inputXY,
        gyronorm : inputGyronorm
    })[getDeviceMode()]
        .init(network);
}

function onDOMContentLoaded() {
    // Run all values as selectors and save in place
    Object.keys(EL).forEach(function (k) { EL[k] = document.getElementById(k);});

    initNetwork();
    initInput();
}

document.addEventListener('DOMContentLoaded', onDOMContentLoaded);
window.ontouchmove = function (e) { e.preventDefault(); };
},{"./getHashId":2,"./inputGyronorm":3,"./inputXY":4,"./network":5}],2:[function(require,module,exports){
var ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";

/**
 * @param {number} [length]
 * @returns {string}
 */

function getHashId(length) {
    var id = '';
    for (length = length || 4; length > 0; length--) {
        id += ID_CHARS[Math.floor(ID_CHARS.length * Math.random())];
    }

    return id;
}

module.exports = getHashId;
},{}],3:[function(require,module,exports){
var network;

var GYRONORM_CONFIG = { frequency : 25, decimalCount : 0 };
var gn;

function onGyroNormData(data) {
    // Send update
    network.emit('gyronorm', {
        rotation : [
            data.do.beta,
            data.do.alpha,
            data.do.gamma * -1
        ].join(' '),

        dx : data.dm.x,
        dy : data.dm.y,
        dz : data.dm.z
    });
}

function init(networkInstance) {
    network = networkInstance;
    gn      = new GyroNorm();
    gn
        .init(GYRONORM_CONFIG)
        .then(gn.start.bind(gn, onGyroNormData))
        .catch(console.error.bind(console));
}

function remove() {
    if (gn) {
        gn.stop();
        gn.end();
    }
}

module.exports = {
    init   : init,
    remove : remove
};
},{}],4:[function(require,module,exports){
var throttle = require('./throttle');

var network;

var originX = 0;
var originY = 0;

function onTouchStart(e) {
    var t = e.changedTouches;

    // Support single touch point
    if (t.length === 1) {
        originX = t[0].pageX;
        originY = t[0].pageY;
    }
}

var dX     = 0;
var prevDX = 0;
var dY     = 0;
var prevDY = 0;

function _onTouchMove(e) {
    var t = e.changedTouches;

    // Support single touch point
    if (t.length === 1) {
        dX = t[0].pageX - originX;
        dY = t[0].pageY - originY;

        // Send update
        network.emit('xy', {
            dx : -dX,
            dy : -dY
        });

        prevDY = dY;
        prevDX = dX;
    }
}

function onTouchEnd(e) {
    var t = e.changedTouches;

    // Support single touch point
    if (t.length === 1) {
        dX = t[0].pageX - originX;
        dY = t[0].pageY - originY;

        // Send update
        network.emit('xy', {
            dx         : dX,
            dy         : dY,
            isTouchEnd : true
        });

        dX     = 0;
        prevDX = 0;
        dY     = 0;
        prevDY = 0;
    }
}

var onTouchMove = throttle(_onTouchMove, 10);

function init(networkInstance) {
    network = networkInstance;
    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
}

function remove() {
    network = null;
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
}

module.exports = {
    init   : init,
    remove : remove
};
},{"./throttle":6}],5:[function(require,module,exports){
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
        firebaseRef = window.firebase.database().ref('sessions/' + firebaseDeviceId);
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
            eventName : eventName,
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
    if(useSocketIO){
        window.socket.on(eventName, eventHandlerFunc);
        return window.socket;
    } else if(useFirebase) {

    }
}

module.exports = {
    init : init,
    emit : emit,
    on   : on
};
},{}],6:[function(require,module,exports){
module.exports = function throttle(fn, threshhold, scope) {
    threshhold || (threshhold = 250);
    var last, deferTimer;
    return function () {
        var context = scope || this;

        var now  = +new Date,
            args = arguments;
        if (last && now < last + threshhold) {
            // hold on to it
            clearTimeout(deferTimer);
            deferTimer = setTimeout(function () {
                last = now;
                fn.apply(context, args);
            }, threshhold);
        } else {
            last = now;
            fn.apply(context, args);
        }
    };
};
},{}]},{},[1]);
