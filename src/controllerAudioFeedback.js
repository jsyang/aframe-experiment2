var load = require('audio-loader');
var oscillator;
var audioContext;
var gainNode;

var soundFilesBuffers;

function init() {

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioContext.createGain();

    oscillator   = audioContext.createOscillator();
    oscillator.type = "sawtooth";
    oscillator.start(0);

    gainNode.connect(audioContext.destination);
    gainNode.gain.value = 0.05;

    loadSoundFiles({
        pop : 'pop.mp3'
    }, { from : "assets/sfx/" });
}

function setFreq(freq) {
    oscillator.frequency.value = freq;
}

function start() {
    oscillator.connect(gainNode);
}

function stop() {
    oscillator.disconnect();
}

function remove() {
    oscillator   = undefined;
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
    var source = audioContext.createBufferSource();
    source.buffer = soundFilesBuffers[soundName];
    source.connect(audioContext.destination);
    source.start();
}

module.exports = {
    init           : init,
    setFreq        : setFreq,
    start          : start,
    stop           : stop,
    remove         : remove,
    loadSoundFiles : loadSoundFiles,
    playSoundFile  : playSoundFile
};