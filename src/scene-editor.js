// idea for this is to be like the symbolics lisp machine?
// everything inside this environment is editable?
// run arbitrary code?

// should probably use canvas to draw a texture instead of bmfont
// it might be much much faster
// https://www.npmjs.com/package/aframe-textwrap-component

// use https://github.com/curiousdannii/ifvms.js to get infocom game text
// parse returned text? or read zmachine memory values?

AFRAME.registerComponent("draw", require("aframe-draw-component").component);
AFRAME.registerComponent("textwrap", require("aframe-textwrap-component").component);

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
    text   : '',
    cmd    : ''
};

function updateText() {
    //EL.text.setAttribute('bmfont-text', 'text', STATE.text + STATE.cmd + '_');
    EL.text.setAttribute('textwrap', 'text', STATE.text + STATE.cmd + '_');
}

//////////////////////////////////////////////////////////////////////////////////////////

// User events

function onKB(e) {
    if (typeof e.string !== 'undefined') {
        STATE.cmd += e.string;
        updateText();
    } else if (e.humanString === 'Backspace') {
        STATE.cmd = STATE.cmd.substr(0, STATE.cmd.length - 1);
        updateText();
    } else if (e.humanString === 'Enter') {
        STATE.text += [
            STATE.cmd,
            '>> ' + eval(STATE.cmd),
            ''
        ].join('\n');
        STATE.cmd = '';
        updateText();

    }
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
