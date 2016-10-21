var audio   = require('./audio');
var network = require('./network');

var EL = {
    scene      : null,
    duck1      : null,
    zapper     : null,
    hitArea    : null,
    sightField : null,
    sightLine  : null
};

var STATE = {};

//////////////////////////////////////////////////////////////////////////////////////////

function onGyronorm(value) {
    var rotation = value.rotation.split(' ').map(parseFloat);
    rotation[0] += 90;
    EL.zapper.setAttribute('rotation', rotation.join(' '));
}

function onTap() {
    audio.playSoundFile('shot');

    if (intersectedDuck) {
        audio.playSoundFile('end');
    }
}

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

var duckPosition = {
    x : 0,
    y : 6,
    z : -12
};

var lastFrameTime = new Date();
function animateDuck() {
    var currentTime = new Date();

    var dTime = currentTime - lastFrameTime;
    if (dTime >= 200) {
        nextDuckFrame();
        lastFrameTime = currentTime;
    }

    if (dTime >= 20) {
        duckPosition.x -= 0.1;
        if(duckPosition.x < -24) {
            duckPosition.x = 24;
        }
        EL.duck1.setAttribute('position', duckPosition);
    }

    requestAnimationFrame(animateDuck);
}

function onSightFieldIntersected(e) {
    var vec3 = e.detail.intersection.point;
    EL.hitArea.setAttribute('position', vec3);
}

////////////// DOM BOILERPLATE

function onDOMContentLoaded() {
    // Run all values as selectors and save in place
    Object.keys(EL).forEach(function (k) { EL[k] = document.getElementById(k);});

    EL.duck1.addEventListener('raycaster-intersected', onDuck1Intersected);
    EL.duck1.addEventListener('raycaster-intersected-cleared', onDuck1IntersectedCleared);

    EL.sightField.addEventListener('raycaster-intersected', onSightFieldIntersected);

    initNetwork();
    animateDuck();

    audio.init({
        from   : 'assets/duckhunt/',
        sounds : {
            shot : 'shot.wav',
            end  : 'end.mp3'
        }
    });
}

document.addEventListener('DOMContentLoaded', onDOMContentLoaded);