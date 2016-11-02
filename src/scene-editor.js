window.LiveReloadOptions = { host : location.hostname };
require('livereload-js');

var network = require('./network');

var EL = {
    scene : null,
    text  : null
};

//////////////////////////////////////////////////////////////////////////////////////////

// Logic

var STATE = {
    isInVR : false,
    rAF    : null,
    text   : ''
};

function updateText() {
    EL.text.setAttribute('bmfont-text', 'text', STATE.text);
}

//////////////////////////////////////////////////////////////////////////////////////////

// User events

function onKB(e) {
    if (e.string) {
        STATE.text += e.string;
    } else if (e.humanString === 'Backspace') {
        STATE.text = STATE.text.substr(0, STATE.text.length - 1);
    } else if (e.humanString === 'Space') {
        STATE.text += ' ';
    } else if (e.humanString === 'Enter') {
        STATE.text += '\n';
    }
    updateText();
}

//////////////////////////////////////////////////////////////////////////////////////////

// Network

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
        // way too slow. gonna try UDP and cordova
        return {
            useSocketIO : true,
            url         : location.protocol + '//' + location.hostname + ':3001'
        };
    }
}

function initNetwork() {
    // Demo doesn't support Firebase.
    network
        .init(getNetworkSettings())
        .on('kb', onKB);
}

function tick() {
    STATE.rAF = requestAnimationFrame(tick);
}

//////////////////////////////////////////////////////////////////////////////////////////

// Entry point

function onTouchEnd() {
    if (STATE.isInVR) {
        EL.scene.exitVR();
        STATE.isInVR = false;
    } else {
        EL.scene.enterVR();
        STATE.isInVR = true;
    }
}

function onDOMContentLoaded() {
    // Run all values as selectors and save in place
    Object.keys(EL).forEach(function (k) { EL[k] = document.getElementById(k);});

    initNetwork();

    window.addEventListener('touchend', onTouchEnd);
}

document.addEventListener('DOMContentLoaded', onDOMContentLoaded);
