var config = {
    data : {
        paths : { src : 'src', build : 'build' }
    }
};

module.exports = function (grunt) {
    grunt.registerTask('ioserver', function () {
        require('./server/index');
    });
    require('load-grunt-config')(grunt, config);
};