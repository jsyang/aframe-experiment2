// Via https://aframe.io/docs/0.3.0/core/component.html#write-a-component
(function () {
    var coordinates = AFRAME.utils.coordinates;

    /**
     * @param {string} value
     * @returns {Array}
     */
    function parsePathValue(value) {
        return value.split(',').map(coordinates.parse);
    }

    /**
     * @param {vec3[]} data
     * @returns {string}
     */
    function stringifyPathData(data) {
        return data.map(coordinates.stringify).join(',');
    }

    /**
     * via http://stackoverflow.com/questions/15795348/generate-mesh-faces-for-vertices-in-three-js
     * @param oldData
     */
    function update(oldData) {
        var geometry = new THREE.Geometry();
        var material = new THREE.MeshBasicMaterial({ color : this.data.color });

        geometry.vertices = this.data.path;
        var triangles = THREE.ShapeUtils.triangulateShape(this.data.path, []);

        triangles.forEach(function(tri){
            geometry.faces.push(
                new THREE.Face3(tri[0], tri[1], tri[2])
            );
        });

        this.el.setObject3D('mesh', new THREE.Mesh(geometry, material));
    }

    function remove() {
        this.el.removeObject3D('mesh');
    }

    AFRAME.registerComponent('polygon', {
        schema : {
            color : { default : '#aaaa11' },
            path  : {
                default   : [
                    { x : -0.5, y : 0, z : 0 },
                    { x : 0.5, y : 0, z : 0 },
                    { x : 0.5, y : 0.5, z : 0 }
                ],
                parse     : parsePathValue,
                stringify : stringifyPathData
            }
        },
        update : update,
        remove : remove
    });

})();
