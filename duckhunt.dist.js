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
var load = require('audio-loader');
var audioContext;

var soundFilesBuffers;
var deferredPlaySoundFile;

function init(options) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    loadSoundFiles(options.sounds, { from : options.from });
}

function remove() {
    soundFilesBuffers = undefined;
    audioContext      = undefined;
}

// Load external sound files
// API here:
function loadSoundFiles(source, options) {
    load(source, options)
        .then(function (audio) {
            soundFilesBuffers = audio;

            // Play last sound that attempted to play before
            // all audio was ready
            if (deferredPlaySoundFile) {
                playSoundFile(deferredPlaySoundFile);
            }
        });
}

function playSoundFile(soundName) {
    if (soundFilesBuffers) {
        var source    = audioContext.createBufferSource();
        source.buffer = soundFilesBuffers[soundName];
        source.connect(audioContext.destination);
        source.start();
    } else {
        deferredPlaySoundFile = soundName;
    }
}

module.exports = {
    init           : init,
    remove         : remove,
    loadSoundFiles : loadSoundFiles,
    playSoundFile  : playSoundFile
};
},{"audio-loader":3}],7:[function(require,module,exports){
var audio   = require('./audio');
var network = require('./network');

var EL = {
    scene       : null,
    bg2         : null,
    duck1       : null,
    zapper      : null,
    hitArea     : null,
    hitBox      : null,
    sightField  : null,
    sightLine   : null,
    player      : null,
    sky         : null,
    dog         : null,
    dogGotDucks : null
};

//////////////////////////////////////////////////////////////////////////////////////////

// Game logic

/** @constant */
var SHOT_CAPACITY        = 3;
var DOG_WALK_SPEED       = 0.0125;
var DOG_INITIAL_POSITION = {
    x : -2,
    y : 1.38,
    z : -6
};

var DUCK_SPEED_SLOW       = 0.1;
var DUCK_DIRECTIONS       = 'UpLeft,UpRight,AcrossLeft,AcrossRight'.split(',');
var DUCK_START_DIRECTIONS = 'UpLeft,UpRight'.split(',');

var STATE = {
    rAF            : null,
    shotsRemaining : 3,

    // Animations
    duck1State                 : 'UpLeft',
    duck1CurrentFrame          : 1,
    duck1StartFrame            : 1,
    duck1EndFrame              : 1,
    duck1LastFrameTime         : 0,
    duck1Alive                 : false,
    duck1DirectionChangeChance : 0.04,

    // Positioning
    duck1Position : {
        x : 0,
        y : 0,
        z : -12
    },

    // Dog
    dogActive                  : true,
    dogBarks                   : 0,
    dogMaxBarks                : 3,
    dogSniffs                  : 0,
    dogMaxSniffs               : 14,
    dogState                   : 'Walk',
    dogCurrentFrame            : 1,
    dogStartFrame              : 1,
    dogEndFrame                : 4,
    dogFramesInCurrentState    : 0,
    dogMaxFramesInCurrentState : 8,
    dogLastFrameTime           : 0,

    dogPosition : DOG_INITIAL_POSITION,

    // Dog got ducks
    dogGotDucksActive   : false,
    dogGotDucksShown    : false,
    dogGotDucksPosition : { x : 0, y : 0, z : 0 }
};

function getRandomInt(min, max) {
    return min + Math.floor(Math.random() * (max - min));
}

//////////////////////////////////////////////////////////////////////////////////////////

// Shot fired effect

var COLOR_DARK_SKY = 'rgb(9,20,30)';
var COLOR_BLUE_SKY = 'rgb(72,161,241)';

function applyShotFiredEffect() {
    EL.sky.setAttribute('material', 'color', COLOR_DARK_SKY);
    EL.hitArea.setAttribute('material', 'visible', false);
    EL.hitBox.setAttribute('material', 'visible', true);
}

function removeShotFiredEffect() {
    EL.sky.setAttribute('material', 'color', COLOR_BLUE_SKY);
    EL.hitArea.setAttribute('material', 'visible', true);
    EL.hitBox.setAttribute('material', 'visible', false);
}

//////////////////////////////////////////////////////////////////////////////////////////

// User events

function onGyronorm(value) {
    var rotation       = value.rotation;
    var playerRotation = EL.player.getAttribute('rotation');
    
    rotation.x -= playerRotation.x - 90;
    rotation.y -= playerRotation.y;
    rotation.z -= playerRotation.z;
    EL.zapper.setAttribute('rotation', rotation);
}

function onTap() {
    //if (STATE.shotsRemaining > 0) {
    audio.playSoundFile('shot');
    applyShotFiredEffect();

    if (intersectedDuck === EL.duck1) {
        setDuck1StateToShot();
    }

    //    STATE.shotsRemaining--;
    //} else {
    STATE.shotsRemaining = SHOT_CAPACITY;
    //}

    setTimeout(removeShotFiredEffect, 40);
}

//////////////////////////////////////////////////////////////////////////////////////////

// Network

function onFirebaseValue(res) {
    res = res.val();
    if (res.eventName === 'gyronorm') {
        onGyronorm(res.eventValue);
    } else if (res.eventName === 'tap') {
        onTap();
    }
}

var useFirebase = false;

function getNetworkSettings() {
    if (useFirebase) {
        var deviceId = prompt('deviceId', localStorage.getItem('deviceId'));
        localStorage.setItem('deviceId', deviceId);

        return {
            useFirebase : true,
            deviceId    : deviceId
        };
    } else {
        return {
            useSocketIO : true,
            url         : location.protocol + '//' + location.hostname + ':3001'
        };
    }
}

function initNetwork() {
    if (useFirebase) {
        network
            .init(getNetworkSettings())
            .on('value', onFirebaseValue);
    } else {
        network
            .init(getNetworkSettings())
            .on('tap', onTap)
            .on('gyronorm', onGyronorm);
    }

}

//////////////////////////////////////////////////////////////////////////////////////////

// Ducks

function setDuck1RandomDirection(isStart) {
    if (isStart) {
        STATE.duck1State = DUCK_START_DIRECTIONS[
            Math.floor(Math.random() * DUCK_START_DIRECTIONS.length)
            ];

    } else {
        STATE.duck1State = DUCK_DIRECTIONS[
            Math.floor(Math.random() * DUCK_DIRECTIONS.length)
            ];
    }

    if (getRandomInt(0, 2) === 1) {
        audio.playSoundFile('duck');
    }
}

function setDuck1StateToDown() {
    STATE.duck1State        = 'Down';
    STATE.duck1CurrentFrame = 1;
    STATE.duck1StartFrame   = 1;
    STATE.duck1EndFrame     = 2;
    audio.playSoundFile('down');
}

function setDuck1StateToShot() {
    setDogGotDucksRotationPosition();
    STATE.duck1State = 'Shot';
}

function setDuck1StateToNotAlive() {
    EL.duck1.setAttribute('material', 'visible', false);
    STATE.duck1Alive = false;
}

function setDuck1StateToAliveWithRandomPosition() {
    setDuck1RandomDirection(true);
    EL.duck1.setAttribute('material', 'visible', true);
    STATE.duck1Alive      = true;
    STATE.duck1Position.y = 0;
    STATE.duck1Position.x = getRandomInt(-5, 5);
    EL.duck1.setAttribute('position', STATE.duck1Position);
    STATE.duck1CurrentFrame = 1;
    STATE.duck1StartFrame   = 1;
    STATE.duck1EndFrame     = 3;
}

function animateDuck1() {
    var state = STATE.duck1State;
    var now   = new Date();
    var dTime = now - STATE.duck1LastFrameTime;

    if (state === 'Shot') {
        if (EL.duck1.getAttribute('material').src !== '#duckShot') {
            EL.duck1.setAttribute('material', 'src', '#duckShot');
            STATE.duck1LastFrameTime = now;
        } else if (dTime >= 600) {
            setDuck1StateToDown();
            STATE.duck1LastFrameTime = now;
        }
    } else if (state === 'Down') {
        // Falling
        if (STATE.duck1Position.y > 0) {
            if (dTime > 20) {
                moveDuck1({ dy : -DUCK_SPEED_SLOW });
            }

            if (dTime >= 100) {
                EL.duck1.setAttribute('material', 'src', '#duckDown' + STATE.duck1CurrentFrame);
                STATE.duck1CurrentFrame  = STATE.duck1CurrentFrame === 2 ? 1 : 2;
                STATE.duck1LastFrameTime = now;
            }
        } else {
            setDuck1StateToNotAlive();
            audio.playSoundFile('drop');
            setTimeout(setDogGotDucksActive, 400);
        }

    } else {
        if (dTime > 150) {
            EL.duck1.setAttribute(
                'material',
                'src',
                '#duck' + STATE.duck1State + STATE.duck1CurrentFrame
            );

            STATE.duck1CurrentFrame++;
            if (STATE.duck1CurrentFrame > STATE.duck1EndFrame) {
                STATE.duck1CurrentFrame = STATE.duck1StartFrame;
            }
            STATE.duck1LastFrameTime = now;

            if (STATE.duck1Position.y > 4 && Math.random() < STATE.duck1DirectionChangeChance) {
                setDuck1RandomDirection();
            }
            audio.playSoundFile('flapping');
        }

        if (dTime > 20) {
            var speed = DUCK_SPEED_SLOW;

            if (state === 'AcrossLeft') {
                moveDuck1({ dx : -speed });

            } else if (state === 'AcrossRight') {
                moveDuck1({ dx : speed });

            } else if (state === 'UpRight') {
                moveDuck1({ dx : speed, dy : speed });

            } else if (state === 'UpLeft') {
                moveDuck1({ dx : -speed, dy : speed });
            }
        }
    }

}

function tickDuck1() {
    if (STATE.duck1Alive) {
        animateDuck1();
    } else {
        setDuck1StateToNotAlive();
    }
}

function moveDuck1(options) {
    if (options.dx) {
        STATE.duck1Position.x += options.dx;
    }

    if (options.dy) {
        STATE.duck1Position.y += options.dy;
    }

    if (Math.abs(STATE.duck1Position.x) > 16 || Math.abs(STATE.duck1Position.y) > 16) {
        setDuck1StateToNotAlive();
        randomSpawn();
    } else {
        EL.duck1.setAttribute('position', STATE.duck1Position);
    }
}

function spawnDuck1() {
    setDuck1StateToAliveWithRandomPosition();
    STATE.duck1DirectionChangeChance += 0.005;
}

function randomSpawn() {
    setTimeout(spawnDuck1, 1000);
}

//////////////////////////////////////////////////////////////////////////////////////////

// Dog

function resetDog() {
    STATE.dogActive   = true;
    STATE.dogPosition = DOG_INITIAL_POSITION;
    STATE.dogSniffs   = 0;
    STATE.dogBarks    = 0;
    EL.dog.setAttribute('material', 'depthTest', false);
}

function setDogStateToWalk() {
    STATE.dogState                   = 'Walk';
    STATE.dogCurrentFrame            = 1;
    STATE.dogStartFrame              = 1;
    STATE.dogEndFrame                = 4;
    STATE.dogFramesInCurrentState    = 0;
    STATE.dogMaxFramesInCurrentState = getRandomInt(1, 8);
}

function setDogStateToSniff() {
    STATE.dogState = 'Sniff';
}

function setDogStateToReady() {
    STATE.dogState = 'Ready';
}

function setDogStateToJump() {
    STATE.dogState         = 'Jump1';
    STATE.dogLastFrameTime = new Date();
}

function setDogStateToJumpFall() {
    STATE.dogState = 'Jump2';
    EL.dog.setAttribute('material', 'depthTest', true);
}

function moveDog(options) {
    if (options.dx) {
        STATE.dogPosition.x += options.dx;
    }

    if (options.dy) {
        STATE.dogPosition.y += options.dy;
    }

    if (options.dz) {
        STATE.dogPosition.z += options.dz;
    }

    EL.dog.setAttribute('position', STATE.dogPosition);
}

function dogBark() {
    if (STATE.dogBarks < STATE.dogMaxBarks) {
        STATE.dogBarks++;
        audio.playSoundFile('bark');
        setTimeout(dogBark, 300);
    }
}

function animateDog() {
    var state = STATE.dogState;
    var now   = new Date();
    var dTime = now - STATE.dogLastFrameTime;

    if (state === 'Walk') {
        if (dTime > 80) {
            EL.dog.setAttribute(
                'material',
                'src',
                '#dog' + STATE.dogState + STATE.dogCurrentFrame
            );

            STATE.dogCurrentFrame++;
            if (STATE.dogCurrentFrame > STATE.dogEndFrame) {
                STATE.dogCurrentFrame = STATE.dogStartFrame;
            }
            STATE.dogLastFrameTime = now;
            STATE.dogFramesInCurrentState++;

            if (STATE.dogFramesInCurrentState === STATE.dogMaxFramesInCurrentState) {
                if (STATE.dogSniffs > STATE.dogMaxSniffs) {
                    setDogStateToReady();
                } else {
                    STATE.dogSniffs++;
                    setDogStateToSniff();
                }
            }
        }

        if (dTime > 20) {
            moveDog({ dx : DOG_WALK_SPEED });
        }
    } else if (state === 'Sniff') {
        EL.dog.setAttribute('material', 'src', '#dogSniff');

        if (dTime > 140) {
            setDogStateToWalk();
        }
    } else if (state === 'Ready') {
        EL.dog.setAttribute('material', 'src', '#dogReady');

        if (dTime > 300) {
            setDogStateToJump();
            setTimeout(dogBark, 500);
        }
    } else if (state === 'Jump1' || state === 'Jump2') {
        EL.dog.setAttribute('material', 'src', '#dog' + state);

        if (state === 'Jump1') {
            if (STATE.dogPosition.y < 3.5) {
                moveDog({ dx : 0.02, dy : 0.12, dz : -0.12 });
            } else {
                setDogStateToJumpFall();
                bg2TextureBlendHack();
            }
        } else if (state === 'Jump2') {
            if (STATE.dogPosition.y > 1.38) {
                moveDog({ dx : 0.01, dy : -0.15 });
            } else {
                // Trigger round start
                randomSpawn();
                STATE.dogActive = false;
            }
        }
    }
}

function tickDog() {
    if (STATE.dogActive) {
        if (STATE.dogFramesInCurrentState <= STATE.dogMaxFramesInCurrentState) {
            animateDog();
        }
    }
}

//////////////////////////////////////////////////////////////////////////////////////////

// Dog got ducks

var DEG_TO_RAD         = Math.PI / 180;
var DOG_GOT_DUCKS_DIST = 9;

function setDogGotDucksRotationPosition() {
    var rotation = EL.player.getAttribute('rotation');

    EL.dogGotDucks.setAttribute('rotation', {
        x : 0,
        y : rotation.y,
        z : 0
    });

    var position = { x : 0, y : 0, z : 0 };

    // todo: something's weird with this calculation
    var angleDuckRelativeToPlayer = (EL.zapper.getAttribute('rotation').y + rotation.y) * DEG_TO_RAD;

    position.x = -Math.sin(angleDuckRelativeToPlayer) * DOG_GOT_DUCKS_DIST;
    position.z = -Math.cos(angleDuckRelativeToPlayer) * DOG_GOT_DUCKS_DIST;

    EL.dogGotDucks.setAttribute('position', position);

    STATE.dogGotDucksShown    = false;
    STATE.dogGotDucksPosition = position;

}

function setDogGotDucksInActive() {
    STATE.dogGotDucksActive = false;
}

function setDogGotDucksActive() {
    STATE.dogGotDucksActive = true;
    audio.playSoundFile('end');
}

function moveDogGotDucks(options) {
    if (options.dy) {
        STATE.dogGotDucksPosition.y += options.dy;
    }

    EL.dogGotDucks.setAttribute('position', STATE.dogGotDucksPosition);
}

function setDogGotDucksShown() {
    STATE.dogGotDucksShown = true;
}

var DOG_GOT_DUCKS_SPEED = 0.08;

function tickDogGotDucks() {
    if (STATE.dogGotDucksActive) {
        var now   = new Date();
        var dTime = now - STATE.dogLastFrameTime;

        if (dTime > 10) {
            if (STATE.dogGotDucksShown) {
                // Moving back down

                if (STATE.dogGotDucksPosition.y > 0) {
                    moveDogGotDucks({ dy : -DOG_GOT_DUCKS_SPEED });
                } else {
                    setDogGotDucksInActive();
                    randomSpawn();
                }

            } else {
                // Rising up to show ducks
                if (STATE.dogGotDucksPosition.y < 2.5) {
                    moveDogGotDucks({ dy : DOG_GOT_DUCKS_SPEED });
                } else if (!STATE.dogGotDucksShown) {
                    setTimeout(setDogGotDucksShown, 600);
                }

            }

            STATE.dogLastFrameTime = now;
        }

    }
}

//////////////////////////////////////////////////////////////////////////////////////////

// Game events

var intersectedDuck;

function onDuck1Intersected() {
    intersectedDuck = EL.duck1;
}

function onDuck1IntersectedCleared() {
    intersectedDuck = undefined;
}

function onSightFieldIntersected(e) {
    var vec3 = e.detail.intersection.point;
    EL.hitArea.setAttribute('position', vec3);
}

function tick() {
    tickDuck1();
    tickDog();
    tickDogGotDucks();
    STATE.rAF = requestAnimationFrame(tick);

}

var hackApplied = false;

// Hack to get BG2 texture to blend correctly
function bg2TextureBlendHack() {
    if (!hackApplied) {
        EL.bg2.components['material-overdraw'].update();
        hackApplied = true;
    }
}

//////////////////////////////////////////////////////////////////////////////////////////

// Entry point

function onDOMContentLoaded() {
    // Run all values as selectors and save in place
    Object.keys(EL).forEach(function (k) { EL[k] = document.getElementById(k);});

    EL.duck1.addEventListener('raycaster-intersected', onDuck1Intersected);
    EL.duck1.addEventListener('raycaster-intersected-cleared', onDuck1IntersectedCleared);

    EL.sightField.addEventListener('raycaster-intersected', onSightFieldIntersected);

    initNetwork();

    audio.init({
        from   : 'assets/duckhunt/',
        sounds : {
            flapping      : 'flapping.mp3',
            drop          : 'drop.mp3',
            down          : 'down.mp3',
            duck          : 'duck.mp3',
            shot          : 'shot.mp3',
            end           : 'end.mp3',
            bark          : 'bark.mp3',
            duckHuntIntro : 'duckHuntIntro.mp3'
        }
    });

    audio.playSoundFile('duckHuntIntro');
    setDogStateToWalk();
    tick();
}

document.addEventListener('DOMContentLoaded', onDOMContentLoaded);

//////////////////////////////////////////////////////////////////////////////////////////

// Debug stuff

window.addEventListener('keydown', function onKeyPress(e) {
    if (e.which === 32) { // Space
        onTap();

    } else if (e.which === 16) { // Shift
        spawnDuck1();
    }
});

},{"./audio":6,"./network":8}],8:[function(require,module,exports){
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
},{}]},{},[7]);
