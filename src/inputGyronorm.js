var inputTap = require('./inputTap');

var network;

var GYRONORM_CONFIG = { frequency : 25, decimalCount : 0 };
var gn;

function onGyroNormData(data) {
    // Send update
    network.emit('gyronorm', {
        rotation : {
            x : data.do.beta,
            y : data.do.alpha,
            z : data.do.gamma * -1
        },

        dx : data.dm.x,
        dy : data.dm.y,
        dz : data.dm.z
    });
}

function init(networkInstance) {
    inputTap.init(networkInstance);

    network = networkInstance;
    gn      = new GyroNorm();
    gn
        .init(GYRONORM_CONFIG)
        .then(gn.start.bind(gn, onGyroNormData))
        .catch(console.error.bind(console));
}

function remove() {
    inputTap.remove();

    if (gn) {
        gn.stop();
        gn.end();
    }
}

module.exports = {
    init   : init,
    remove : remove
};