var network;

function emitTap() {
    network.emit('tap', true);
}

// Mouse events

function onMouseUp() {
    emitTap();
}

// Touch events


var pressDownTime;

function onTouchStart(e) {
    var t = e.changedTouches;

    if (t.length === 1) {
        pressDownTime = new Date();
    }
}

function onTouchEnd(e) {
    var t = e.changedTouches;

    if (t.length === 1) {
        var now = new Date();

        if(now - pressDownTime > 1200) {
            // Hack to recalibrate gyronorm
            window.location.reload();
        } else {
            emitTap();
        }
    }
}

function init(networkInstance) {
    network = networkInstance;
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchstart', onTouchStart);
}

function remove() {
    network = null;
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('touchend', onTouchEnd);
}

module.exports = {
    init   : init,
    remove : remove
};