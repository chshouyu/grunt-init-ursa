/**
 * grunt-ursa config
 */

var nunjucks = require('nunjucks');
var _ = require('lodash');
var path = require('path');

nunjucks.configure('template', {
    autoescape: true
});

/*global module:false*/
module.exports = function(grunt) {

    var repeatReg = /^(\w+)@(\d+)$/; // "key@10"
    var processRepeatData = function(obj) {
        for (var key in obj) {
            if (_.isObject(obj[key])) {
                processRepeatData(obj[key]);
            }
            var match = key.match(repeatReg);
            var k, c, target, i = 0;
            if (match) {
                k = match[1];
                c = match[2];
                obj[k] = [];
                while (i++ < c) {
                    if (_.isObject(obj[key])) {
                        target = _.clone(obj[key]);
                        for (var subkey in target) {
                            if (_.isString(target[subkey])) {
                                target[subkey] = target[subkey].replace(/\$/g, i);
                            }
                        }
                    } else if (_.isString(obj[key])) {
                        target = obj[key].replace(/\$/g, i);
                    }
                    obj[k].push(target);
                }
            }
        }
    };

    var getTemplateData = function(token, callback) {
        var htmlJSON, filePath = '_data/' + token + '.json';
        if (!grunt.file.exists(filePath) || !grunt.file.isFile(filePath)) {
            htmlJSON = {};
        } else {
            htmlJSON = grunt.file.read(filePath);
            htmlJSON = htmlJSON.replace(/\/\*[\s\S]*?\*\/|^\s+|\s+$/g, '');
            if (htmlJSON == '') {
                htmlJSON = {};
            } else {
                try {
                    htmlJSON = JSON.parse(htmlJSON);
                    processRepeatData(htmlJSON);
                } catch (e) {
                    return callback && callback(e);
                }
            }
        }
        callback && callback(null, _.extend(htmlJSON, {
            _token: token
        }));
    };

    // Project configuration.
    grunt.initConfig({
        requirejs: { // 处理css和js
            mainJs: {
                options: {
                    name: 'main',
                    baseUrl: 'static/js/',
                    out: 'build/static/js/main.js'
                }
            },
            mainCss: {
                options: {
                    optimizeCss: 'standard', // 标准方式，移除所有空格、注释等
                    // optimizeCss: 'standard.keepLines', // 类似标准方式，但是保留换行
                    // optimizeCss: 'standard.keepComments', // 保留注释，但是移除换行
                    // optimizeCss: 'standard.keepComments.keepLines', // 保留注释，保留换行
                    // optimizeCss: 'standard.keepWhitespace', // 保留不必要的空格
                    cssIn: 'static/css/main.css',
                    out: 'build/static/css/main.css'
                }
            }
        },
        imagemin: { // 处理图片
            build: {
                files: [{
                    expand: true,
                    cwd: 'static/img/',
                    src: ['*.{png,jpg,gif}'],
                    dest: 'build/static/img/'
                }]
            }
        },
        htmlmin: { // 处理html
            build: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true,
                    removeCommentsFromCDATA: true,
                    removeCDATASectionsFromCDATA: true,
                    removeEmptyAttributes: true
                },
                files: [{
                    expand: true,
                    cwd: 'template/',
                    src: ['*.html'],
                    dest: 'build/template/'
                }]
            }
        },
        connect: {
            dev: {
                options: {
                    keepalive: true,
                    debug: true,
                    directory: ['template', 'build/html'],
                    middleware: function(connect, options, middlewares) {
                        middlewares.push(function(req, res, next) {
                            if (req.url.match(/\/(.+)\.html$|\//)) {
                                var html, token = path.basename(req.url, '.html') || 'index';
                                getTemplateData(token, function(err, jsonData) {
                                    if (err) {
                                        return res.end(err.toString());
                                    }
                                    html = nunjucks.render(token + '.html', jsonData);
                                    res.end(html);
                                });
                            } else {
                                next();
                            }
                        });
                        middlewares.push(connect.static('static'));
                        return middlewares;
                    }
                }
            }
        },
        nunjucks: {
            build: {
                files: [{
                    expand: true,
                    cwd: 'template/',
                    src: ['*.html'],
                    dest: 'build/html/'
                }]
            }
        },
        build_static_prefix: '..',
        build_img_prefix: '../..',
        online_static_prefix: '',
        test_static_prefix: 'http://www.mycdn.com/gruntursa',
        css_js_reg: /(href|src|baseUrl)([=:])\s*['"](?!http|https)(.+?)['"]/g,
        img_reg: /url\(['"]?(?!http|https)(.+?)['"]?\)/g,
        replace_files: ['build/template/*.html', 'build/html/*.html', 'build/static/css/*.css'],
        replace: {
            test: {
                src: '<%= replace_files %>',
                overwrite: true,
                replacements: [{
                    from: '<%= css_js_reg %>',
                    to: '$1$2"<%= test_static_prefix %>$3"'
                }, {
                    from: '<%= img_reg %>',
                    to: 'url(<%= test_static_prefix %>$1)'
                }]
            },
            build: {
                src: '<%= replace_files %>',
                overwrite: true,
                replacements: [{
                    from: '<%= css_js_reg %>',
                    to: '$1$2"<%= build_static_prefix %>$3"'
                }, {
                    from: '<%= img_reg %>',
                    to: 'url(<%= build_img_prefix %>$1)'
                }]
            },
            online: {
                src: '<%= replace_files %>',
                overwrite: true,
                replacements: [{
                    from: '<%= css_js_reg %>',
                    to: '$1$2"<%= online_static_prefix %>$3"'
                }, {
                    from: '<%= img_reg %>',
                    to: 'url(<%= online_static_prefix %>$1)'
                }]
            }
        },
        clean: ['build'],
        filerev: {
            options: {
                encoding: 'utf8',
                algorithm: 'md5',
                length: 8
            },
            img: {
                src: 'build/static/img/*.{jpg,png,gif}'
            },
            css: {
                src: 'build/static/css/*.css'
            },
            js: {
                src: 'build/static/js/*.js'
            }
        },
        usemin: {
            html: ['build/template/*.html', 'build/html/*.html'],
            css: ['build/static/css/*.css'],
            options: {
                assetsDirs: ['build']
            }
        }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-text-replace');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-filerev');
    grunt.loadNpmTasks('grunt-usemin');

    grunt.registerMultiTask('nunjucks', 'parse nunjucks template to html', function() {
        this.files.forEach(function(fileObj) {
            var filePath = path.basename(fileObj.src[0]);
            var token = path.basename(filePath, '.html');
            getTemplateData(token, function(err, jsonData) {
                if (err) {
                    return grunt.log.error(err);
                }
                htmlContent = nunjucks.render(filePath, jsonData);
                grunt.file.write(fileObj.dest, htmlContent, {
                    encoding: 'utf8'
                });
                var colorPath = grunt.log.wordlist([fileObj.dest], {
                    color: 'cyan'
                });
                grunt.log.ok('parse ' + colorPath + ' success.');
            });
        });
    });

    // Default task.
    grunt.registerTask('start', ['connect']);
    grunt.registerTask('build', ['clean', 'requirejs', 'imagemin:build', 'htmlmin:build', 'nunjucks:build', 'filerev', 'usemin', 'replace:build']);
    grunt.registerTask('publish', ['']);

};