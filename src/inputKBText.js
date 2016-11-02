var eventToString = require('key-event-to-string')();
var network;

var kbCapture;

function onKBCaptureKeyDown(e) {
    var string = this.value;

    if (string) {
        network.emit('kb', { string : string });
    } else {
        network.emit('kb', { humanString : eventToString(e) });
    }

    this.value = '';
}

function onWindowFocus() {
    kbCapture.focus();
}

function init(networkInstance) {
    network = networkInstance;

    window.addEventListener('focus', onWindowFocus);
    window.onfocus = onWindowFocus;

    document.body.insertAdjacentHTML(
        'afterbegin',
        '<input type=text id=_kbcapture style="position: absolute; top: 0; left:0;width:100%;height:100%">'
    );

    kbCapture = document.getElementById('_kbcapture');
    kbCapture.addEventListener('keyup', onKBCaptureKeyDown);
    kbCapture.focus();
}

function remove() {
    network = null;

    window.removeEventListener('focus', onWindowFocus);

    kbCapture.removeEventListener('keydown', onKBCaptureKeyDown);
    kbCapture = null;
}

module.exports = {
    init   : init,
    remove : remove
};