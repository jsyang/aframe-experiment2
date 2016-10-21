/* global AFRAME, THREE */
if (typeof AFRAME === 'undefined') {
    throw new Error('Component attempted to register before AFRAME was available.');
}

/**
 * Cubemap component for A-Frame.
 */
AFRAME.registerComponent('material-overdraw', {
    schema : {
        overdraw : {
            default : 0.8
        }
    },

    update : function (oldData) {
        this.el.getObject3D('mesh').material.overdraw = this.data.overdraw;
    },
    remove : function () { }
});