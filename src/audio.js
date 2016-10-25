var load = require('audio-loader');
var audioContext;

var soundFilesBuffers;
var deferredPlaySoundFile;

function init(options) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    loadSoundFiles(options.sounds, { from : options.from });
}

function remove() {
    soundFilesBuffers = undefined;
    audioContext      = undefined;
}

// Load external sound files
// API here:
function loadSoundFiles(source, options) {
    load(source, options)
        .then(function (audio) {
            soundFilesBuffers = audio;

            // Play last sound that attempted to play before
            // all audio was ready
            if (deferredPlaySoundFile) {
                playSoundFile(deferredPlaySoundFile);
            }
        });
}

function playSoundFile(soundName) {
    if (soundFilesBuffers) {
        var source    = audioContext.createBufferSource();
        source.buffer = soundFilesBuffers[soundName];
        source.connect(audioContext.destination);
        source.start();
    } else {
        deferredPlaySoundFile = soundName;
    }
}

module.exports = {
    init           : init,
    remove         : remove,
    loadSoundFiles : loadSoundFiles,
    playSoundFile  : playSoundFile
};