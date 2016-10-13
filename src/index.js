var network = require('./network');

var EL = {
    scene             : null,
    cursor            : null,
    gazeCursor        : null,
    floor             : null,
    angularSum        : null,
    floorCursorSphere : null
};

var STATE = {
    floorCursorPoint : null,
    fpVertices       : []
};

function onFloorRaycasterIntersected(e) {
    var vec3 = e.detail.intersection.point;
    setFloorCursorPosition(vec3);
}

function setFloorCursorPosition(vec3) {
    STATE.floorCursorPoint = vec3;

    EL.floorCursorSphere.setAttribute('position', vec3);
}

function getFPVertexHTML(vec3) {
    return '<a-sphere mixin="fpVertex" position="' + AFRAME.utils.coordinates.stringify(vec3) + '"></a-sphere>';
}

function getFPLineHTML(from, to) {
    var stringify = AFRAME.utils.coordinates.stringify;
    return '<a-entity mixin="fpLine" line="path: ' + stringify(from) + ',' + stringify(to) + '"></a-entity>';
}

function addFPVertex() {
    var point = AFRAME.utils.extend({}, STATE.floorCursorPoint);

    var lastPoint = STATE.fpVertices[0];

    if (lastPoint) {
        EL.scene.insertAdjacentHTML('beforeend', getFPLineHTML(lastPoint, point));
    }

    STATE.fpVertices.unshift(point);
    EL.scene.insertAdjacentHTML('beforeend', getFPVertexHTML(point));
}

function addFPPolygon() {
    var polygonEntity = '<a-entity mixin="fpPlane" polygon="path:' +
        STATE.fpVertices
            .map(AFRAME.utils.coordinates.stringify)
            .join(',')
        + '"></a-entity>';

    EL.scene.insertAdjacentHTML('beforeend', polygonEntity);
}

function onKeyPress(e) {
    if (e.which === 32) {
        // Spacebar
        addFPVertex();

    } else if (e.which === 13) {
        // Enter
        addFPPolygon();
    }
}

//////////////////////////////////////////////////////////////////////////////////////////

var angularSum = 0;

function onAngular(angularResponse) {
    if (angularResponse.isEnd) {
        angularSum = 0;
    } else {
        angularSum += angularResponse.dRadian;
        EL.angularSum.innerHTML = Math.round(angularSum / Math.PI * 180) + ' deg';
    }
}

function initNetwork() {
    network
        .init({
            useSocketIO : true,
            url         : "http://localhost:3001"
        })
        .on('angular', onAngular);
}

function onDOMContentLoaded() {
    // Run all values as selectors and save in place
    Object.keys(EL).forEach(function (k) { EL[k] = document.getElementById(k);});

    EL.floor
        .addEventListener('raycaster-intersected', onFloorRaycasterIntersected);

    window.addEventListener('keypress', onKeyPress);
    //EL.gazeCursor.addEventListener('click', onClick);

    initNetwork();
}

document.addEventListener('DOMContentLoaded', onDOMContentLoaded);