var audio   = require('./audio');
var network = require('./network');

var EL = {
    scene : null,
    duck1 : null
};

var STATE = {};

//////////////////////////////////////////////////////////////////////////////////////////

function onFirebaseValue(res) {
    if (res.eventName === 'gyronorm') {
        var v = res.eventValue;

    } else if (res.eventName === 'tap') {
        audio.playSoundFile('shot');

        if (intersectedDuck) {
        }
    }
}

/*
 var NETWORK_SETTINGS = {
 useSocketIO : true,
 url         : location.protocol + '//' + location.hostname + ':3001'
 };
 */

function getNetworkSettings() {
    var deviceId = prompt('deviceId', localStorage.getItem('deviceId'));
    localStorage.setItem('deviceId', deviceId);

    return {
        useFirebase : true,
        deviceId    : deviceId
    };
}

function initNetwork() {
    network
        .init(getNetworkSettings())
        .on('value', onFirebaseValue);
}

var intersectedDuck;

function onDuck1Intersected() {
    intersectedDuck = EL.duck1;
}

function onDuck1IntersectedCleared() {
    intersectedDuck = undefined;
}

////////////// DUCK ANIMATIONS

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

////////////// DOM BOILERPLATE

function onDOMContentLoaded() {
    // Run all values as selectors and save in place
    Object.keys(EL).forEach(function (k) { EL[k] = document.getElementById(k);});

    EL.duck1.addEventListener('raycaster-intersected', onDuck1Intersected);
    EL.duck1.addEventListener('raycaster-intersected-cleared', onDuck1IntersectedCleared);

    initNetwork();
    animateDuck();

    audio.init({
        from   : 'assets/duckhunt/',
        sounds : {
            shot : 'shot.wav'
        }
    });
}

document.addEventListener('DOMContentLoaded', onDOMContentLoaded);