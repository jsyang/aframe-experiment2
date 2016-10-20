(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var network = require('./network');

var EL = {
    scene : null,
    duck1 : null
};

var STATE = {};

//////////////////////////////////////////////////////////////////////////////////////////

function onFirebaseValue(res) {

}

/*
 var NETWORK_SETTINGS = {
 useSocketIO : true,
 url         : location.protocol + '//' + location.hostname + ':3001'
 };
 */

var NETWORK_SETTINGS = {
    useFirebase : true,
    deviceId    : ''
};

function initNetwork() {
    network
        .init(NETWORK_SETTINGS)
        .on('value', onFirebaseValue);
}

function onDuckIntersected() {

}

var DUCK_PREFIX = '#duckAcrossLeft';
var i           = 1;

function nextDuckFrame() {
    EL.duck1.setAttribute('material', 'src', DUCK_PREFIX + i);
    i++;
    if (i > 3) {
        i = 1;
    }
}

var lastFrameTime = new Date();
function animateDuck() {
    var currentTime = new Date();
    if (currentTime - lastFrameTime >= 200) {
        nextDuckFrame();
        lastFrameTime = currentTime;
    }

    requestAnimationFrame(animateDuck);
}

function onDOMContentLoaded() {
    // Run all values as selectors and save in place
    Object.keys(EL).forEach(function (k) { EL[k] = document.getElementById(k);});

    EL.duck1
        .addEventListener('raycaster-intersected', onDuckIntersected);

    initNetwork();
    animateDuck();
}

document.addEventListener('DOMContentLoaded', onDOMContentLoaded);
},{"./network":2}],2:[function(require,module,exports){
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
},{}]},{},[1]);
