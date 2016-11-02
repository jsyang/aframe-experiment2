// Watches for changes to CSS or email templates then runs grunt tasks
module.exports = {
    options : {
        livereload : true
    },
    html    : {
        files : ['*.html']
    },

    js : {
        files   : ["src/*.js", "!src/*.dist.js"],
        "tasks" : "browserify".split(',')
    }
};
