var git = require('git-rev-sync')

module.exports = function (grunt) {
    grunt.initConfig({
        replace: {
            dist: {
                options: {
                    patterns: [
                        {
                            match: 'GITCOMMITHASH',
                            replacement: git.short(),
                        },
                        {
                            match: 'GITCOMMITDATE',
                            replacement: git.date().toDateString(),
                        },
                    ],
                },
                files: [{
                    src: 'publish/index.html',
                    dest: 'publish/',
                    expand: true,
                    flatten: true,
                }],
            },
        },
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
            all: {
                files: [
                    {
                        src: [
                            'loading.svg',
                            '*.png',
                            'favicon.ico',
                            'site.webmanifest',
                            '*.css',
                            'countries.json',
                            '*.html',
                            '*.js',
                            '!gruntfile.js',
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
        connect: {
            server: {
                options: {
                    port: 8000,
                    base: 'publish',
                    keepalive: true,
                }
            }
        },
    });

    // load plugins
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-replace');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-minjson');

    // register at least this one task
    grunt.registerTask('default', [ 'uglify' , 'htmlmin' , 'replace' , 'cssmin' , 'minjson' , 'copy:main' ]);

    grunt.registerTask('go', [ 'uglify' , 'htmlmin' , 'replace' , 'cssmin' , 'minjson' , 'copy:main' , 'connect' ]);

    grunt.registerTask('go-dev', [ 'copy:all' , 'replace' , 'connect' ]);
};