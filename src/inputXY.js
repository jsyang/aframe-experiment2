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

    stop(e);
}

function _onTouchMove(e) {
    var t = e.changedTouches;

    // Support single touch point
    if (t.length === 1) {
        pointMove(t[0]);
    }

    stop(e);
}

function onTouchEnd(e) {
    var t = e.changedTouches;

    // Support single touch point
    if (t.length === 1) {
        pointEnd(t[0]);
    }

    stop(e);
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