// aframe-canvas.js
// modified.
// repo    : https://github.com/richardanaya/aframe-canvas
// license : MIT

AFRAME.registerComponent('canvas-material', {
    schema : {
        width  : {
            type    : 'int',
            default : 0
        },
        height : {
            type    : 'int',
            default : 0
        }
    },

    update : function () {
        if (!this.canvas) {
            this.canvas = document.createElement("canvas");
        }

        this.canvas.width  = this.data.width;
        this.canvas.height = this.data.height;

        var _this          = this;

        this.getContext    = function () {
            var ctx = _this.canvas.getContext("2d");
            return ctx;
        };

        this.updateTexture = function () {
            texture.needsUpdate = true;
        };

        var texture        = new THREE.Texture(this.canvas);

        // Make textures blend
        var material       = new THREE.MeshStandardMaterial({
            map         : texture,
            transparent : true,
            alphaTest   : 0.5
        });

        //HACK:adding timeout because child[0] not immediately available
        setTimeout(function () {
            _this.el.object3D.children[0].material = material;
            _this.updateTexture();
        }, 100);
    }
});