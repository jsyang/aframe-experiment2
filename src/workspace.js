var network = require('./network');

var EL = {
    wdioClientScreen1 : null,
    wdioClientScreen2 : null
};

////////////////////////////////////////////////////////////////////////////////

// Canvas material boilerplate

function drawImage(i) {
    var canvasMaterialComponent = EL.wdioClientScreen2.components["canvas-material"];
    var c                       = canvasMaterialComponent.getContext();

    c.drawImage(i, 0, 0, 800, 600);
    canvasMaterialComponent.updateTexture();
}

////////////////////////////////////////////////////////////////////////////////

// WebdriverIO Client Responses

function onWDIOClientResponse(res) {
    console.log('wdioClientResponse');

    if (res) {
        if (res[0] === 'elementScreenshot' || res[0] === 'screenshot') {
            var dataURI = 'data:image/png;base64,' + res[1];
            var img     = new Image();
            img.onload  = drawImage.bind(null, img);
            img.src     = dataURI;
        }

        executeNextWDIOCommand();
    }
}

////////////////////////////////////////////////////////////////////////////////

// RobotJS Client Responses

var ctx2d;
var canvasMaterialComponent;

var hasScreenBeenSized = false;

function onRobotJSScreenshotDiff(diffBuffer) {
    var startTime = new Date();
    var imageData = new ImageData(
        new Uint8ClampedArray(diffBuffer),
        screenshotWidth,
        screenshotHeight
    );
    createImageBitmap(imageData)
        .then(setTextureFromImageBitmap.bind(null, startTime));
}

function setTextureFromImageBitmap(startTime, imageBitmap) {
    ctx2d.drawImage(imageBitmap, 0, 0);
    canvasMaterialComponent.updateTexture();

    document.title = (new Date()) - startTime;
}

var screenshotWidth;
var screenshotHeight;

function onRobotJSScreenshotInit(initBuffer, width, height) {
    if (!hasScreenBeenSized) {
        EL.wdioClientScreen1.setAttribute('geometry', 'width', width * 0.0075);
        EL.wdioClientScreen1.setAttribute('geometry', 'height', height * 0.0075);
        hasScreenBeenSized = true;
    }

    if (!ctx2d) {
        canvasMaterialComponent = EL.wdioClientScreen1.components["canvas-material"];
        ctx2d                   = canvasMaterialComponent.getContext();
    }

    screenshotWidth  = width;
    screenshotHeight = height;

    var imageData = new ImageData(
        new Uint8ClampedArray(initBuffer),
        width,
        height
    );
    ctx2d.putImageData(imageData, 0, 0);
    canvasMaterialComponent.updateTexture();

}

function onTap() {
    sendScreenshotRequest();
}

////////////////////////////////////////////////////////////////////////////////

// Network
var networkCommandQueue = [];

function executeNextWDIOCommand() {
    var nextCommand = networkCommandQueue.shift();
    if (nextCommand) {
        network.emit('wdioClientRequest', nextCommand);
    }
}

function initNetwork() {
    network
        .init({
            useSocketIO : true,
            url         : location.protocol + '//' + location.hostname + ':3001'
        })
        .on('robotJSScreenshotInit', onRobotJSScreenshotInit)
        .on('robotJSScreenshotDiff', onRobotJSScreenshotDiff)
        .on('wdioClientResponse', onWDIOClientResponse)
        .on('tap', onTap);

    networkCommandQueue = [
        { clientId : 'abc', requestType : 'init' },
        { clientId : 'abc', requestType : 'setViewportSize', requestValue : { width : 800, height : 600 } },
        { clientId : 'abc', requestType : 'url', requestValue : 'https://en.m.wikipedia.org/wiki/Virtual_reality' },
        { clientId : 'abc', requestType : 'screenshot', requestValue : '' },
        { clientId : 'abc', requestType : 'end' }
    ];

    executeNextWDIOCommand();
}

////////////////////////////////////////////////////////////////////////////////

// Entry point

function onDOMContentLoaded() {
    // Run all values as selectors and save in place
    Object.keys(EL).forEach(function (k) { EL[k] = document.getElementById(k);});

    initNetwork();
    sendScreenshotRequest();
}

document.addEventListener('DOMContentLoaded', onDOMContentLoaded);

// debug stuff

function sendScreenshotRequest() {
    network.emit('robotJSRequest', { requestType : 'screenshot' });
}

////////////////////////////////////////////////////////////////////////////////

// Github API for Github VR Viewer

function onGithubSearchResults(e) {
    var jsonResponse = JSON.parse(e.currentTarget.responseText);
    debugger;

}

function getGithubSearchResults(options) {
    var xhr    = new XMLHttpRequest();
    xhr.onload = onGithubSearchResults;
    // https://developer.github.com/v3/search/#search-repositories
    xhr.open('GET', 'https://api.github.com/search/repositories?q=aframe');
    xhr.setRequestHeader(
        "Authorization",
        "Basic " + btoa(options.username + ":" + options.password)
    );
    xhr.send();
}