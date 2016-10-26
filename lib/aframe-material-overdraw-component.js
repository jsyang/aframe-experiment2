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
            default : 0.2
        }
    },

    update : function (oldData) {
        var material         = this.el.getObject3D('mesh').material;
        material.overdraw    = this.data.overdraw;
        material.transparent = true;
        material.alphaTest   = 0.5;
        material.needsUpdate = true;
    },

    remove : function () { }
});