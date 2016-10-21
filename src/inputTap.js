var network;

function emitTap() {
    network.emit('tap', true);
}

// Mouse events

function onMouseUp() {
    emitTap();
}

// Touch events

function onTouchEnd() {
    emitTap();
}

function init(networkInstance) {
    network = networkInstance;
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchend', onTouchEnd);
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