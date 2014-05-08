/*
 * grunt-init-ursa
 *
 * Copyright (c) 2014 chshouyu
 * Licensed under the MIT license.
 */

'use strict';

// Basic template description.
exports.description = 'Init a grunt-ursa project.';

// Template-specific notes to be displayed before question prompts.
exports.notes = 'Init a grunt-ursa project. This will copy some basic ' +
    'template and static files in your current folder.';

exports.after = 'You should now install project dependencies with _npm ' +
    'install_. After that, you may execute project tasks with _grunt_. ' +
    '\n\n' +
    'for example:' +
    '\n\n' +
    '_grunt start_' +
    '\n\n' +
    'For ' +
    'more information about installing and configuring Grunt, please see ' +
    'the Getting Started guide:' +
    '\n\n' +
    'http://gruntjs.com/getting-started';

// Any existing file or directory matching this wildcard will cause a warning.
exports.warnOn = 'Gruntfile.js';

// The actual init template.
exports.template = function(grunt, init, done) {

    init.process({
        type: 'grunt'
    }, [{
        name: 'confirm',
        message: 'This will overwrite your exits files, continue?',
        default: 'Y/n',
        warning: 'Yes: project init. No: exit.'
    }], function(err, props) {

        props.confirm = /y/i.test(props.confirm);

        if (props.confirm) {
            var files = init.filesToCopy(props);
            init.copyAndProcess(files, props, {
                noProcess: 'template/*.html'
            });
        }
        done();
    });

};