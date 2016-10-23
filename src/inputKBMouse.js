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