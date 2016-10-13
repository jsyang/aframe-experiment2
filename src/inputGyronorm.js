var network;

var GYRONORM_CONFIG = { frequency : 25, decimalCount : 0 };
var gn;

function onGyroNormData(data) {
    // Send update
    network.emit('gyronorm', {
        rotation : [
            data.do.beta,
            data.do.alpha,
            data.do.gamma * -1
        ].join(' '),

        dx : data.dm.x,
        dy : data.dm.y,
        dz : data.dm.z
    });
}

function init(networkInstance) {
    network = networkInstance;
    gn      = new GyroNorm();
    gn
        .init(GYRONORM_CONFIG)
        .then(gn.start.bind(gn, onGyroNormData))
        .catch(console.error.bind(console));
}

function remove() {
    if (gn) {
        gn.stop();
        gn.end();
    }
}

module.exports = {
    init   : init,
    remove : remove
};