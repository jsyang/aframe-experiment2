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