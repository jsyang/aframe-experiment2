var load = require('audio-loader');
var audioContext;

var soundFilesBuffers;

function init(options) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    loadSoundFiles(options.sounds, { from : options.from });
}

function remove() {
    soundFilesBuffers = undefined;
    audioContext = undefined;
}

// Load external sound files
// API here:
function loadSoundFiles(source, options) {
    load(source, options)
        .then(function (audio) {
            soundFilesBuffers = audio;
        });
}

function playSoundFile(soundName) {
    var source    = audioContext.createBufferSource();
    source.buffer = soundFilesBuffers[soundName];
    source.connect(audioContext.destination);
    source.start();
}

module.exports = {
    init           : init,
    remove         : remove,
    loadSoundFiles : loadSoundFiles,
    playSoundFile  : playSoundFile
};