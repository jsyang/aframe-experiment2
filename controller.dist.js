(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var window = require('global/window');

var Context = window.AudioContext || window.webkitAudioContext;
if (Context) module.exports = new Context;

},{"global/window":5}],2:[function(require,module,exports){
'use strict'

// DECODE UTILITIES
function b64ToUint6 (nChr) {
  return nChr > 64 && nChr < 91 ? nChr - 65
    : nChr > 96 && nChr < 123 ? nChr - 71
    : nChr > 47 && nChr < 58 ? nChr + 4
    : nChr === 43 ? 62
    : nChr === 47 ? 63
    : 0
}

// Decode Base64 to Uint8Array
// ---------------------------
function decode (sBase64, nBlocksSize) {
  var sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, '')
  var nInLen = sB64Enc.length
  var nOutLen = nBlocksSize
    ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize
    : nInLen * 3 + 1 >> 2
  var taBytes = new Uint8Array(nOutLen)

  for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
    nMod4 = nInIdx & 3
    nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4
    if (nMod4 === 3 || nInLen - nInIdx === 1) {
      for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
        taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255
      }
      nUint24 = 0
    }
  }
  return taBytes
}

module.exports = { decode: decode }

},{}],3:[function(require,module,exports){
/* global XMLHttpRequest */
'use strict'
var load = require('./load')
var context = require('audio-context')

module.exports = function (source, options) {
  var ac = options && options.context ? options.context : context
  var defaults = { decode: getAudioDecoder(ac), fetch: fetch }
  var opts = Object.assign(defaults, options)
  return load(source, opts)
}

/**
 * Wraps AudioContext's decodeAudio into a Promise
 */
function getAudioDecoder (ac) {
  return function decode (buffer) {
    return new Promise(function (resolve, reject) {
      ac.decodeAudioData(buffer,
        function (data) { resolve(data) },
        function (err) { reject(err) })
    })
  }
}

/*
 * Wraps a XMLHttpRequest into a Promise
 *
 * @param {String} url
 * @param {String} type - can be 'text' or 'arraybuffer'
 * @return {Promise}
 */
function fetch (url, type) {
  return new Promise(function (done, reject) {
    var req = new XMLHttpRequest()
    if (type) req.responseType = type

    req.open('GET', url)
    req.onload = function () {
      req.status === 200 ? done(req.response) : reject(Error(req.statusText))
    }
    req.onerror = function () { reject(Error('Network Error')) }
    req.send()
  })
}

},{"./load":4,"audio-context":1}],4:[function(require,module,exports){
'use strict'

var base64 = require('./base64')

// Given a regex, return a function that test if against a string
function fromRegex (r) {
  return function (o) { return typeof o === 'string' && r.test(o) }
}
// Try to apply a prefix to a name
function prefix (pre, name) {
  return typeof pre === 'string' ? pre + name
    : typeof pre === 'function' ? pre(name)
    : name
}

/**
 * Load one or more audio files
 *
 *
 * Possible option keys:
 *
 * - __from__ {Function|String}: a function or string to convert from file names to urls.
 * If is a string it will be prefixed to the name:
 * `load('snare.mp3', { from: 'http://audio.net/samples/' })`
 * If it's a function it receives the file name and should return the url as string.
 * - __only__ {Array} - when loading objects, if provided, only the given keys
 * will be included in the decoded object:
 * `load('piano.json', { only: ['C2', 'D2'] })`
 *
 * @param {Object} source - the object to be loaded
 * @param {Object} options - (Optional) the load options for that object
 * @param {Object} defaultValue - (Optional) the default value to return as
 * in a promise if not valid loader found
 */
function load (source, options, defVal) {
  var loader =
    // Basic audio loading
      isArrayBuffer(source) ? decodeBuffer
    : isAudioFileName(source) ? loadAudioFile
    : isPromise(source) ? loadPromise
    // Compound objects
    : isArray(source) ? loadArrayData
    : isObject(source) ? loadObjectData
    : isJsonFileName(source) ? loadJsonFile
    // Base64 encoded audio
    : isBase64Audio(source) ? loadBase64Audio
    : isJsFileName(source) ? loadMidiJSFile
    : null

  var opts = options || {}
  return loader ? loader(source, opts)
    : defVal ? Promise.resolve(defVal)
    : Promise.reject('Source not valid (' + source + ')')
}

// BASIC AUDIO LOADING
// ===================

// Load (decode) an array buffer
function isArrayBuffer (o) { return o instanceof ArrayBuffer }
function decodeBuffer (array, options) {
  return options.decode(array)
}

// Load an audio filename
var isAudioFileName = fromRegex(/\.(mp3|wav|ogg)(\?.*)?$/i)
function loadAudioFile (name, options) {
  var url = prefix(options.from, name)
  return load(options.fetch(url, 'arraybuffer'), options)
}

// Load the result of a promise
function isPromise (o) { return o && typeof o.then === 'function' }
function loadPromise (promise, options) {
  return promise.then(function (value) {
    return load(value, options)
  })
}

// COMPOUND OBJECTS
// ================

// Try to load all the items of an array
var isArray = Array.isArray
function loadArrayData (array, options) {
  return Promise.all(array.map(function (data) {
    return load(data, options, data)
  }))
}

// Try to load all the values of a key/value object
function isObject (o) { return o && typeof o === 'object' }
function loadObjectData (obj, options) {
  var dest = {}
  var promises = Object.keys(obj).map(function (key) {
    if (options.only && options.only.indexOf(key) === -1) return null
    var value = obj[key]
    return load(value, options, value).then(function (audio) {
      dest[key] = audio
    })
  })
  return Promise.all(promises).then(function () { return dest })
}

// Load the content of a JSON file
var isJsonFileName = fromRegex(/\.json(\?.*)?$/i)
function loadJsonFile (name, options) {
  var url = prefix(options.from, name)
  return load(options.fetch(url, 'text').then(JSON.parse), options)
}

// BASE64 ENCODED FORMATS
// ======================

// Load strings with Base64 encoded audio
var isBase64Audio = fromRegex(/^data:audio/)
function loadBase64Audio (source, options) {
  var i = source.indexOf(',')
  return load(base64.decode(source.slice(i + 1)).buffer, options)
}

// Load .js files with MidiJS soundfont prerendered audio
var isJsFileName = fromRegex(/\.js(\?.*)?$/i)
function loadMidiJSFile (name, options) {
  var url = prefix(options.from, name)
  return load(options.fetch(url, 'text').then(midiJsToJson), options)
}

// convert a MIDI.js javascript soundfont file to json
function midiJsToJson (data) {
  var begin = data.indexOf('MIDI.Soundfont.')
  if (begin < 0) throw Error('Invalid MIDI.js Soundfont format')
  begin = data.indexOf('=', begin) + 2
  var end = data.lastIndexOf(',')
  return JSON.parse(data.slice(begin, end) + '}')
}

if (typeof module === 'object' && module.exports) module.exports = load
if (typeof window !== 'undefined') window.loadAudio = load

},{"./base64":2}],5:[function(require,module,exports){
(function (global){
if (typeof window !== "undefined") {
    module.exports = window;
} else if (typeof global !== "undefined") {
    module.exports = global;
} else {
    module.exports = {};
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(require,module,exports){
var defaultOptions = {
  cmd: 'Cmd',
  ctrl: 'Ctrl',
  alt: 'Alt',
  shift: 'Shift',
  joinWith: ' + '
}

var options = {}

var keyMap = {
  8: 'Backspace',
  9: 'Tab',
  13: 'Enter',
  27: 'Escape',
  32: 'Space',
  36: 'Home',
  33: 'Page Up',
  34: 'Page Down',
  35: 'End',
  37: 'Left',
  38: 'Up',
  39: 'Right',
  40: 'Down',
  46: 'Delete',
  186: ';',
  187: '=',
  188: ',',
  189: '-',
  190: '.',
  192: '`',
  222: "'"
}

function buildKeyMap (e) {
  var isOnlyModifier = [16, 17, 18, 91, 93, 224].indexOf(e.keyCode) !== -1
  var character = isOnlyModifier ? null : keyMap[e.keyCode] || String.fromCharCode(e.keyCode)

  return {
    character: character,
    modifiers: {
      cmd: e.metaKey,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      shift: e.shiftKey
    }
  }
}

function buildKeyArray (e) {
  var map = buildKeyMap(e)
  var modifiers = map.modifiers

  var result = []

  if (modifiers.cmd) result.push(options.cmd)
  if (modifiers.ctrl) result.push(options.ctrl)
  if (modifiers.alt) result.push(options.alt)
  if (modifiers.shift) result.push(options.shift)
  if (map.character) result.push(map.character)

  return result
}

function event2string (e) {
  return buildKeyArray(e).join(options.joinWith)
}

function details (e) {
  var map = buildKeyMap(e)
  var mods = map.modifiers

  var hasModifier = mods.cmd || mods.ctrl || mods.alt || mods.shift

  var result = {
    hasKey: map.character != null,
    hasModifier: hasModifier,
    map: map
  }

  return result
}

module.exports = function (userOptions) {
  options = Object.assign(defaultOptions, userOptions)
  return event2string
}

module.exports.details = details

},{}],7:[function(require,module,exports){
var network = require('./network');

var inputXY       = require('./inputXY');
var inputGyronorm = require('./inputGyronorm');
var inputAngular  = require('./inputAngular');
var inputKBMouse  = require('./inputKBMouse');
var inputKBText   = require('./inputKBText');

var getHashId = require('./getHashId');

var isConnected = false;

// DOM Element cache

var EL = {
    settingsOverlay : null,
    settingsTable   : null,

    deviceIdRow       : null,
    deviceId          : null,
    deviceMode        : null,
    networkAddress    : null,
    networkAddressRow : null,
    networkMode       : null,
    networkStatus     : null,
    showHideSettings  : null
};

// Device id

function updateDeviceId(id) {
    id = id || getHashId();
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

var DEVICE_MODE        = 'xy|gyronorm|angular|kbmouse|kbtext';
var REGEXP_DEVICE_MODE = new RegExp(DEVICE_MODE);

function updateDeviceMode(mode) {
    if (REGEXP_DEVICE_MODE.test(mode)) {
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

// Network status

function getNetworkStatus() {
    return isConnected ? 'connected' : 'not connected';
}

function updateTable() {
    EL.deviceMode.value  = getDeviceMode();
    EL.networkMode.value = getNetworkMode();

    EL.networkStatus.value     = getNetworkStatus();
    EL.networkStatus.className = isConnected ? 'green' : 'red';

    if (getNetworkMode() === 'firebase') {
        EL.networkAddressRow.classList.add('hide');
        EL.deviceIdRow.classList.remove('hide');
        EL.deviceId.value = getDeviceId();
    } else {
        EL.deviceIdRow.classList.add('hide');
        EL.networkAddressRow.classList.remove('hide');
    }
}

function onConnect() {
    isConnected = true;
    network.emit('networkAddressRequest', true);
    updateTable();
}

function onReconnectFailed() {
    isConnected = false;
    updateTable();
}

function onConnectError() {
    isConnected                = false;
    EL.networkStatus.className = 'yellow';
    updateTable();
}

function toggleNetworkMode() {
    var networkMode = localStorage.getItem('networkMode') || 'socketio';

    if (networkMode === 'firebase') {
        networkMode = 'socketio';
    } else {
        networkMode = 'firebase';
    }

    localStorage.setItem('networkMode', networkMode);
}

function getNetworkMode() {
    return localStorage.getItem('networkMode') || 'socketio';
}

function getNetworkSettings() {
    var networkMode = getNetworkMode();

    if (networkMode === 'firebase') {
        var deviceId = prompt('deviceId', localStorage.getItem('deviceId'));
        localStorage.setItem('deviceId', deviceId);

        return {
            useFirebase : true,
            deviceId    : deviceId
        };
    } else if (networkMode === 'socketio') {
        return {
            useSocketIO : true,
            url         : location.protocol + '//' + location.hostname + ':3001'
        }
    }
}

function onNetworkAddressResponse(res) {
    EL.networkAddress.value = res;
}

function initNetwork() {
    var networkMode = getNetworkMode();

    if (networkMode === 'socketio') {
        network
            .init(getNetworkSettings())
            .on('networkAddressResponse', onNetworkAddressResponse)
            .on('connect', onConnect)
            .on('connect_error', onConnectError)
            .on('reconnect_failed', onReconnectFailed);
    } else {
        // todo: firebase reconnection stuff
        network
            .init(getNetworkSettings());
        onConnect();
    }

}

////////////////////////////////////////////////////////////////////////////////

// Input management

var mapDeviceModeToInputObject = {
    xy       : inputXY,
    gyronorm : inputGyronorm,
    angular  : inputAngular,
    kbmouse  : inputKBMouse,
    kbtext   : inputKBText
};

function initInput() {
    mapDeviceModeToInputObject[getDeviceMode()]
        .init(network);
}

function removeInput() {
    mapDeviceModeToInputObject[getDeviceMode()]
        .remove();
}

function onDeviceModeChange(e) {
    var selectEl   = e.target;
    var deviceMode = selectEl.options[selectEl.selectedIndex].value;

    if (getDeviceMode() !== deviceMode) {
        console.log('device mode changed to ', deviceMode);
        removeInput();
        updateDeviceMode(deviceMode);
        initInput();
        updateTable();
    }
}

function onDeviceIdClick() {
    var oldDeviceId = getDeviceId();

    updateDeviceId(prompt(
        'Enter a new id for this device',
        oldDeviceId
    ));

    if (getDeviceId() !== oldDeviceId) {
        location.reload();
    }
}

function onNetworkModeClick() {
    toggleNetworkMode();
    location.reload();
}

function onShowHideSetttingsClick() {
    EL.settingsTable.classList.toggle('show');
    EL.settingsOverlay.classList.toggle('show');
}

////////////////////////////////////////////////////////////////////////////////

// Entry point

function onDOMContentLoaded() {
    // Run all values as selectors and save in place
    Object.keys(EL).forEach(function (k) { EL[k] = document.getElementById(k);});

    EL.deviceId.onclick         = onDeviceIdClick;
    EL.deviceMode.onchange      = onDeviceModeChange;
    EL.networkMode.onclick      = onNetworkModeClick;
    EL.showHideSettings.onclick = onShowHideSetttingsClick;

    initNetwork();
    initInput();
}

document.addEventListener('DOMContentLoaded', onDOMContentLoaded);

// Stop touch bounce of web page
window.ontouchmove = function (e) { e.preventDefault(); };
},{"./getHashId":9,"./inputAngular":10,"./inputGyronorm":11,"./inputKBMouse":12,"./inputKBText":13,"./inputXY":15,"./network":16}],8:[function(require,module,exports){
var load = require('audio-loader');
var oscillator;
var audioContext;
var gainNode;

var soundFilesBuffers;

function init() {

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioContext.createGain();

    oscillator   = audioContext.createOscillator();
    oscillator.type = "sawtooth";
    oscillator.start(0);

    gainNode.connect(audioContext.destination);
    gainNode.gain.value = 0.05;

    loadSoundFiles({
        pop : 'pop.mp3'
    }, { from : "assets/sfx/" });
}

function setFreq(freq) {
    oscillator.frequency.value = freq;
}

function start() {
    oscillator.connect(gainNode);
}

function stop() {
    oscillator.disconnect();
}

function remove() {
    oscillator   = undefined;
    audioContext = undefined;
}

// Load external sound files
// API here:
function loadSoundFiles(source, options) {
    load(source, options)
        .then(function (audio) {
            soundFilesBuffers = audio;
        });
}

function playSoundFile(soundName) {
    var source = audioContext.createBufferSource();
    source.buffer = soundFilesBuffers[soundName];
    source.connect(audioContext.destination);
    source.start();
}

module.exports = {
    init           : init,
    setFreq        : setFreq,
    start          : start,
    stop           : stop,
    remove         : remove,
    loadSoundFiles : loadSoundFiles,
    playSoundFile  : playSoundFile
};
},{"audio-loader":3}],9:[function(require,module,exports){
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
},{}],10:[function(require,module,exports){
var controllerAudioFeedback = require('./controllerAudioFeedback');

/**
 * Handle angular input (arc drawing with touch events)
 */

var throttle = require('./throttle');

var network;

var originX = 0;
var originY = 0;
var dX      = 0;
var dY      = 0;
var prevRadian;
var radian  = 0;

/** @constant */
var PIPI = Math.PI * 2;

var angularSum           = 0;
var audioFeedbackdFreq   = 0;
var AUDIO_FEEDBACK_RANGE = {
    FROM : 200,
    TO   : 2000
};

function resetAudioFeedbackFreq() {
    angularSum         = 0;
    audioFeedbackdFreq = (AUDIO_FEEDBACK_RANGE.TO - AUDIO_FEEDBACK_RANGE.FROM) / PIPI;
    controllerAudioFeedback.setFreq(audioFeedbackdFreq + AUDIO_FEEDBACK_RANGE.FROM);
    controllerAudioFeedback.start();
}

function addAudioFeedbackFreq(dFreq) {
    angularSum += dFreq;

    if(Math.abs(angularSum) > PIPI){
        controllerAudioFeedback.stop();
        controllerAudioFeedback.playSoundFile('pop');
        angularSum = 0;
    } else {
        controllerAudioFeedback.setFreq(angularSum * audioFeedbackdFreq + AUDIO_FEEDBACK_RANGE.FROM);
    }
}

// // // // // // // // // // // // // // // //

function onTouchStart(e) {
    var t = e.changedTouches;

    // Support single touch point
    if (t.length === 1) {
        originX    = t[0].pageX;
        originY    = t[0].pageY;
        prevRadian = 0;
    }

    updateTouchCircle(originX, originY);
    resetAudioFeedbackFreq();
}

function _onTouchMove(e) {
    var t = e.changedTouches;

    // Support single touch point
    if (t.length === 1) {
        dX = t[0].pageX - originX;
        dY = t[0].pageY - originY;

        radian = -Math.atan2(-dY, dX);

        if (!isNaN(prevRadian)) {
            // Stop radians from jumping when they hit PIPI
            prevRadian = prevRadian % PIPI;
            radian     = radian % PIPI;

            // Make sure it can't jump from 180 to -180
            if (Math.abs(radian - prevRadian) > Math.PI) {
                if (radian < prevRadian) {
                    radian += PIPI;
                } else {
                    radian -= PIPI;
                }
            }

            // Send update
            network.emit('angular', { dRadian : radian - prevRadian });
            addAudioFeedbackFreq(radian - prevRadian);
        }

        prevRadian = radian;
        updateTouchCircleSmall(t[0].pageX, t[0].pageY);
    }
}

function onTouchEnd(e) {
    var t = e.changedTouches;

    // Support single touch point
    if (t.length === 1) {
        dX = t[0].pageX - originX;
        dY = t[0].pageY - originY;

        radian = -Math.atan2(-dY, dX);

        if (!isNaN(prevRadian)) {
            // Stop radians from jumping when they hit PIPI
            prevRadian = prevRadian % PIPI;
            radian     = radian % PIPI;

            // Make sure it can't jump from 180 to -180
            if (Math.abs(radian - prevRadian) > Math.PI) {
                if (radian < prevRadian) {
                    radian += PIPI;
                } else {
                    radian -= PIPI;
                }
            }

            // Send update
            network.emit('angular', { dRadian : radian - prevRadian, isEnd : true });
            controllerAudioFeedback.stop();

        }

        prevRadian = undefined;
        dX         = 0;
        dY         = 0;
        originY    = 0;
        originX    = 0;
        updateTouchCircle(-100, -100);
        updateTouchCircleSmall(-100, -100);
    }
}

var onTouchMove = throttle(_onTouchMove, 10);

var circleEl;
var circleSmallEl;

function createTouchCircle() {
    circleEl           = document.createElement('div');
    circleEl.className = 'positionAbsolute circle';
    document.body.appendChild(circleEl);
    circleSmallEl           = document.createElement('div');
    circleSmallEl.className = 'positionAbsolute circleSmall';
    document.body.appendChild(circleSmallEl);
}

function updateTouchCircle(x, y) {
    circleEl.style.transform = 'translate(' + Math.round(x) + 'px ,' + Math.round(y) + 'px)';
}

function updateTouchCircleSmall(x, y) {
    circleSmallEl.style.transform = 'translate(' + Math.round(x) + 'px ,' + Math.round(y) + 'px)';
}

function removeTouchCircles() {
    if (circleEl) circleEl.remove();
    if (circleSmallEl) circleSmallEl.remove();
    circleEl      = undefined;
    circleSmallEl = undefined;
}

function init(networkInstance) {
    createTouchCircle();
    updateTouchCircle(-100, -100);
    updateTouchCircleSmall(-100, -100);

    network = networkInstance;
    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    controllerAudioFeedback.init();
}

function remove() {
    removeTouchCircles();
    network = null;
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);

    controllerAudioFeedback.remove();
}

module.exports = {
    init   : init,
    remove : remove
};
},{"./controllerAudioFeedback":8,"./throttle":17}],11:[function(require,module,exports){
var inputTap = require('./inputTap');

var network;

var GYRONORM_CONFIG = { frequency : 5, decimalCount : 0 };
var gn;

function onGyroNormData(data) {
    // Send update
    network.emit('gyronorm', {
        rotation : {
            x : data.do.beta,
            y : data.do.alpha,
            z : data.do.gamma * -1
        },

        dx : data.dm.x,
        dy : data.dm.y,
        dz : data.dm.z
    });
}

function init(networkInstance) {
    inputTap.init(networkInstance);

    network = networkInstance;
    gn      = new GyroNorm();
    gn
        .init(GYRONORM_CONFIG)
        .then(gn.start.bind(gn, onGyroNormData))
        .catch(console.error.bind(console));
}

function remove() {
    inputTap.remove();

    if (gn) {
        gn.stop();
        gn.end();
    }
}

module.exports = {
    init   : init,
    remove : remove
};
},{"./inputTap":14}],12:[function(require,module,exports){
var throttle = require('./throttle');

var network;

////////////////////////////////////////////////////////////////////////////////

// Mouse

function _onMouseMove(e) {
    network.emit('kbmouse', {
        isMouse : true,
        dx      : e.movementX,
        dy      : e.movementY,
        buttons : e.buttons
    });
}

function onMouseDown(e) {
    // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
    network.emit('kbmouse', {
        isMouse : true,
        buttons : e.buttons
    });
}

function onMouseUp(e) {
    // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
    network.emit('kbmouse', {
        isMouse : true,
        buttons : e.buttons
    });
}

////////////////////////////////////////////////////////////////////////////////

// Keyboard

function onKeyUp(e) {
    network.emit('kbmouse', {
        isKB  : true,
        which : e.which
    });
    stop(e);
}

function onKeyDown(e) {
    network.emit('kbmouse', {
        isKB  : true,
        which : e.which
    });
    stop(e);
}

function stop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
}

var onMouseMove = throttle(_onMouseMove, 10);

function requestPointerLock(){
    document.body.requestPointerLock();
}

function init(networkInstance) {
    network = networkInstance;

    document.body.onclick = requestPointerLock;

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('keydown', onKeyDown);
}

function remove() {
    network = null;

    window.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);

    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('keydown', onKeyDown);
}

module.exports = {
    init   : init,
    remove : remove
};
},{"./throttle":17}],13:[function(require,module,exports){
var eventToString = require('key-event-to-string')();
var network;

var kbCapture;

function onKBCaptureKeyDown(e) {
    var string = this.value.trim();

    if (string) {
        network.emit('kb', {
            string : this.value
        });
    } else {
        network.emit('kb', {
            humanString : eventToString(e)
        });
    }

    this.value = '';
}

function onWindowFocus() {
    kbCapture.focus();
}

function init(networkInstance) {
    network = networkInstance;

    window.addEventListener('focus', onWindowFocus);
    window.onfocus = onWindowFocus;

    document.body.insertAdjacentHTML(
        'afterbegin',
        '<input type=text id=_kbcapture style="position: absolute; top: 0; left:0;width:100%;height:100%">'
    );

    kbCapture = document.getElementById('_kbcapture');
    kbCapture.addEventListener('keypress', onKBCaptureKeyDown);
    kbCapture.focus();
}

function remove() {
    network = null;

    window.removeEventListener('focus', onWindowFocus);

    kbCapture.removeEventListener('keydown', onKBCaptureKeyDown);
    kbCapture = null;
}

module.exports = {
    init   : init,
    remove : remove
};
},{"key-event-to-string":6}],14:[function(require,module,exports){
var network;

function emitTap() {
    network.emit('tap', true);
}

// Mouse events

function onMouseUp() {
    emitTap();
}

// Touch events


var pressDownTime;

function onTouchStart(e) {
    var t = e.changedTouches;

    if (t.length === 1) {
        pressDownTime = new Date();
    }
}

function onTouchEnd(e) {
    var t = e.changedTouches;

    if (t.length === 1) {
        var now = new Date();

        if(now - pressDownTime > 1200) {
            // Hack to recalibrate gyronorm
            window.location.reload();
        } else {
            emitTap();
        }
    }
}

function init(networkInstance) {
    network = networkInstance;
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchstart', onTouchStart);
}

function remove() {
    network = null;
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('touchend', onTouchEnd);
}

module.exports = {
    init   : init,
    remove : remove
};
},{}],15:[function(require,module,exports){
var throttle = require('./throttle');

var network;

var originX = 0;
var originY = 0;

function pointStart(e) {
    originX = e.pageX;
    originY = e.pageY;
}

function pointMove(e) {
    network.emit('xy', {
        dx : e.pageX - originX,
        dy : e.pageY - originY
    });
}

function pointEnd(e) {
    network.emit('xy', {
        dx    : e.pageX - originX,
        dy    : e.pageY - originY,
        isEnd : true
    });
}

// Mouse events
var isMouseDown = false;

function onMouseDown(e) {
    pointStart(e);
    isMouseDown = true;
}

function _onMouseMove(e) {
    if (isMouseDown) {
        pointMove(e);
    }
}

function onMouseUp(e) {
    pointEnd(e);
    isMouseDown = false;
}

// Touch events

function onTouchStart(e) {
    var t = e.changedTouches;

    // Support single touch point
    if (t.length === 1) {
        pointStart(t[0]);
    }
}

function _onTouchMove(e) {
    var t = e.changedTouches;

    // Support single touch point
    if (t.length === 1) {
        pointMove(t[0]);
    }

}

function onTouchEnd(e) {
    var t = e.changedTouches;

    // Support single touch point
    if (t.length === 1) {
        pointEnd(t[0]);
    }
}

function stop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
}

var onTouchMove = throttle(_onTouchMove, 10);
var onMouseMove = throttle(_onMouseMove, 10);

function init(networkInstance) {
    network = networkInstance;
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
}

function remove() {
    network = null;
    window.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);

    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
}

module.exports = {
    init   : init,
    remove : remove
};
},{"./throttle":17}],16:[function(require,module,exports){
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
},{}],17:[function(require,module,exports){
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
},{}]},{},[7]);
