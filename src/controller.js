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
    EL.deviceId.value      = getDeviceId();
    EL.deviceMode.value    = getDeviceMode();
    EL.networkMode.value   = getNetworkMode();
    EL.networkStatus.value = getNetworkStatus();
}

function onConnect() {
    isConnected = true;
    updateTable();
}

function onDOMContentLoaded() {
    // Run all values as selectors and save in place
    Object.keys(EL).forEach(function (k) { EL[k] = document.getElementById(k);});

    network
        .init({
            useSocketIO : true,
            url         : "http://localhost:3001"
        })
        .on('connect', onConnect);

    ({
        xy       : inputXY,
        gyronorm : inputGyronorm
    })[getDeviceMode()]
        .init(network);
}

document.addEventListener('DOMContentLoaded', onDOMContentLoaded);
window.ontouchmove = function (e) { e.preventDefault(); };