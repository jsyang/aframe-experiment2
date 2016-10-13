var throttle = require('./throttle');

var network;

var originX = 0;
var originY = 0;

function onTouchStart(e) {
    var t = e.changedTouches;

    // Support single touch point
    if (t.length === 1) {
        originX = t[0].pageX;
        originY = t[0].pageY;
    }
}

var dX     = 0;
var prevDX = 0;
var dY     = 0;
var prevDY = 0;

function _onTouchMove(e) {
    var t = e.changedTouches;

    // Support single touch point
    if (t.length === 1) {
        dX = t[0].pageX - originX;
        dY = t[0].pageY - originY;

        // Send update
        network.emit('xy', {
            dx : -dX,
            dy : -dY
        });

        prevDY = dY;
        prevDX = dX;
    }
}

function onTouchEnd(e) {
    var t = e.changedTouches;

    // Support single touch point
    if (t.length === 1) {
        dX = t[0].pageX - originX;
        dY = t[0].pageY - originY;

        // Send update
        network.emit('xy', {
            dx         : dX,
            dy         : dY,
            isTouchEnd : true
        });

        dX     = 0;
        prevDX = 0;
        dY     = 0;
        prevDY = 0;
    }
}

var onTouchMove = throttle(_onTouchMove, 10);

function init(networkInstance) {
    network = networkInstance;
    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
}

function remove() {
    network = null;
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
}

module.exports = {
    init   : init,
    remove : remove
};