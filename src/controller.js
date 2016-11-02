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