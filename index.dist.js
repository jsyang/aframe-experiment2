(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var network = require('./network');

var EL = {
    scene             : null,
    cursor            : null,
    inputCanvas       : null,
    floor             : null,
    floorCursorSphere : null
};

var STATE = {
    floorCursorPoint : null,
    fpVertices       : []
};

function onFloorRaycasterIntersected(e) {
    var vec3 = e.detail.intersection.point;
    setFloorCursorPosition(vec3);
}

function setFloorCursorPosition(vec3) {
    STATE.floorCursorPoint = vec3;

    EL.floorCursorSphere.setAttribute('position', vec3);
}

function getFPVertexHTML(vec3) {
    return '<a-sphere mixin="fpVertex" position="' + AFRAME.utils.coordinates.stringify(vec3) + '"></a-sphere>';
}

function getFPLineHTML(from, to) {
    var stringify = AFRAME.utils.coordinates.stringify;
    return '<a-entity mixin="fpLine" line="path: ' + stringify(from) + ',' + stringify(to) + '"></a-entity>';
}

function addFPVertex() {
    var point = AFRAME.utils.extend({}, STATE.floorCursorPoint);

    /*
     var lastPoint = STATE.fpVertices[0];

     if (lastPoint) {
     EL.scene.insertAdjacentHTML('beforeend', getFPLineHTML(lastPoint, point));
     }
     */

    STATE.fpVertices.unshift(point);
    EL.scene.insertAdjacentHTML('beforeend', getFPVertexHTML(point));
}

function removeLastFPVertex() {
    STATE.fpVertices.shift();
    var lastFPVertex = document.querySelector('[mixin="fpVertex"]:last-child');
    if (lastFPVertex) lastFPVertex.remove();
}

function removeFPVertices() {
    STATE.fpVertices = [];
    [].slice.call(document.querySelectorAll('[mixin="fpVertex"]'))
        .forEach(scene.removeChild.bind(scene));
}

function addFPPolygon() {
    var polygonEntity = '<a-entity mixin="fpPlane" polygon="path:' +
        STATE.fpVertices
            .map(AFRAME.utils.coordinates.stringify)
            .join(',')
        + '"></a-entity>';

    EL.scene.insertAdjacentHTML('beforeend', polygonEntity);
}

function onKeyPress(e) {
    if (e.which === 32) {
        // Spacebar
        addFPVertex();

    } else if (e.which === 13) {
        // Enter
        addFPPolygon();
    }
}

//////////////////////////////////////////////////////////////////////////////////////////

var angularSum = 0;
var PIPI       = Math.PI * 2;

function onAngular(res) {
    if (res.isEnd) {
        angularSum = 0;
    } else {
        angularSum += res.dRadian;

        // Full rotation clockwise adds a vertex
        if (angularSum >= PIPI) {
            if (STATE.fpVertices.length === 4) {
                addFPPolygon();
                removeFPVertices();
            } else {
                addFPVertex();
            }

            angularSum = 0;
        } else if (angularSum <= -PIPI) {
            removeLastFPVertex();
            angularSum = 0;
        }
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////

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

function initNetwork() {
    network
        .init({
            useSocketIO : true,
            url         : location.protocol + '//' + location.hostname + ':3001'
        })
        .on('xy', onXY)
        .on('angular', onAngular);
}

function onDOMContentLoaded() {
    // Run all values as selectors and save in place
    Object.keys(EL).forEach(function (k) { EL[k] = document.getElementById(k);});

    EL.floor
        .addEventListener('raycaster-intersected', onFloorRaycasterIntersected);

    window.addEventListener('keypress', onKeyPress);

    initNetwork();
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
