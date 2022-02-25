module.exports = function (grunt) {
    grunt.initConfig({

        // define source files and their destinations
        uglify: {
            options: {
                mangle: {
                    reserved: ['Cookies', 'ClipboardJS']
                },
                compress: true,
                output: {
                    comments: false,
                },
            },
            files: { 
                src: ['*.js', '!gruntfile.js',],
                dest: 'publish/',
                expand: true,
                flatten: true,
            },
        },
        htmlmin: {
            dist: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true,
                    collapseBooleanAttributes: true,
                    minifyCSS: true,
                    minifyJS: true,
                },
                files: [{
                    src: '*.html',
                    dest: 'publish/',
                    expand: true,
                    flatten: true,
                }],
            },
        },
        cssmin: {
            target: {
                files: [{
                    src: '*.css',
                    dest: 'publish/',
                    expand: true,
                    flatten: true,
                }],
            },
        },
        minjson: {
            compile: {
                files: {
                    'publish/countries.json': 'countries.json',
                },
            },
        },
        copy: {
            main: {
                files: [
                    {
                        src: [
                            'loading.svg',
                            '*.png',
                            'favicon.ico',
                            'site.webmanifest',
                        ],
                        dest: 'publish/',
                        expand: true,
                        flatten: true,
                    },
                    {
                        src: 'flags/**',
                        dest: 'publish/',
                        expand: true,
                        flatten: false,
                    },
                ],
            },
        },
        watch: {
            js:  { 
                files: ['*.js'],
                tasks: [ 'uglify' ], 
                options: {
                    debounceDelay: 1000,
                },
            },
            css:  { files: '*.css', tasks: [ 'cssmin' ] },
            json:  { files: 'countries.json', tasks: [ 'minjson' ] },
            misc: {
                files: [
                    '*.html',
                    'loading.svg',
                    '*.png',
                    'favicon.ico',
                    'site.webmanifest',
                    'flags/**',
                ],
                tasks: [ 'copy' ],
            },
        },
        connect: {
            server: {
                options: {
                    port: 8000,
                    base: 'publish',
                    keepalive: true,
                }
            }
        }
    });

    // load plugins
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-minjson');

    // register at least this one task
    grunt.registerTask('default', [ 'uglify' , 'htmlmin' , 'cssmin' , 'minjson' , 'copy' ]);

    grunt.registerTask('go', [ 'uglify' , 'htmlmin' , 'cssmin' , 'minjson' , 'copy' , 'connect' ]);


};