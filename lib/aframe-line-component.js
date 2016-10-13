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
     * @param oldData
     */
    function update(oldData) {
        var material = new THREE.LineBasicMaterial({ color : this.data.color });
        var geometry = new THREE.Geometry();

        this.data.path.forEach(function (vec3) {
            geometry.vertices.push(new THREE.Vector3(vec3.x, vec3.y, vec3.z));
        });

        this.el.setObject3D('mesh', new THREE.Line(geometry, material));
    }

    function remove() {
        this.el.removeObject3D('mesh');
    }

    AFRAME.registerComponent('line', {
        schema : {
            color : { default : '#dd2222' },
            path  : {
                default   : [
                    { x : -0.5, y : 0, z : 0 },
                    { x : 0.5, y : 0, z : 0 }
                ],
                parse     : parsePathValue,
                stringify : stringifyPathData
            }
        },
        update : update,
        remove : remove
    });

})();
