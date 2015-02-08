/* global module: false */

module.exports = function(grunt) {
    "use strict";

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        jshint: {
            files: ['Gruntfile.js', 'src/**/*.js'],
            options: {
                globals: { define: true, exports: true, module: true },
                bitwise: true,
                camelcase: true,
                curly: true,
                eqeqeq: true,
                forin: true,
                immed: true,
                indent: 4,
                latedef: true,
                newcap: true,
                noarg: true,
                nonew: true,
                noempty: true,
                undef: true,
                unused: true,
                strict: true,
                trailing: true,
                maxlen: 80,
                browser: true
            }
        },

        uglify: {
            build: {
                src: 'src/runway.js',
                dest: 'build/runway-<%= pkg.version %>.min.js'
            }
        },

        simplemocha: {
            options: {
                globals: ['should'],
                timeout: 3000,
                ignoreLeaks: false,
                grep: '*-test',
                ui: 'bdd',
                reporter: 'tap'
            },

            all: { src: ['test/**/*.js'] }
        },

        mochaTest: {
            test: {
                src: ['test/**/*.js']
            }
        },

        watch: {
            files: ['<%= jshint.files %>', '<%= mochaTest.test.src %>'],
            tasks: ['jshint', 'mochaTest', 'uglify', 'bytesize']
        },

        bytesize: {
            all: {
                src: ['build/*.js']
            }
        }
    });

    // Plugins
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-bytesize');

    // Default task(s).
    grunt.registerTask('default',
        ['jshint', 'mochaTest', 'uglify', 'bytesize']);
};

