(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var EL = {
    'scene'             : null,
    'cursor'            : null,
    'gazeCursor'        : null,
    'floor'             : null,
    'floorCursorSphere' : null
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

function onDOMContentLoaded() {
    // Run all values as selectors and save in place
    Object.keys(EL).forEach(function (k) { EL[k] = document.getElementById(k);});

    EL.floor
        .addEventListener('raycaster-intersected', onFloorRaycasterIntersected);

    window.addEventListener('keypress', onKeyPress);
    //EL.gazeCursor.addEventListener('click', onClick);
}

document.addEventListener('DOMContentLoaded', onDOMContentLoaded);
},{}]},{},[1]);
