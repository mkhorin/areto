'use strict';

const Base = require('./Validator');
const fs = require('fs');

module.exports = class FileValidator extends Base {

    constructor (config) {
        super(Object.assign({
            minSize: 1,
            maxSize: null,
            extensions: null,
            mimeTypes: null
        }, config));
    }

    init () {
        super.init();
        this.createMessage('message', 'Invalid file');
        this.createMessage('tooSmall', 'File size cannot be smaller than {limit} B');
        this.createMessage('tooBig', 'File size cannot exceed {limit} B');
        this.createMessage('wrongExtension', 'Only these file extensions are allowed: {extensions}');
        this.createMessage('wrongMimeType', 'Only these file MIME types are allowed: {mimeTypes}');
    }

    // file {  path, size, extension, mime }
    
    validateValue (file, cb) {
        if (!file || !file.path) {
            return cb(null, this.message);
        }
        fs.stat(file.path, (err, stats)=> {
            if (err || !stats.isFile()) {
                return cb(null, this.message);
            }
            if (this.minSize && file.size < this.minSize) {
                return cb(null, this.tooSmall, {
                    limit: this.minSize
                });
            }
            if (this.maxSize && file.size > this.maxSize) {
                return cb(null, this.tooBig, {
                    limit: this.maxSize
                });
            }
            if (this.extensions instanceof Array
                && (!file.extension || !this.extensions.includes(file.extension.toLowerCase()))) {
                return cb(null, this.wrongExtension, {
                    extensions: this.extensions
                });
            }
            if (this.mimeTypes instanceof Array && (!file.mime || !this.mimeTypes.includes(file.mime))) {
                return cb(null, this.wrongMimeType, {
                    mimeTypes: this.mimeTypes
                });
            }
            cb();
        });
    }

    getParams () {
        return {
            minSize: this.minSize,
            maxSize: this.maxSize,
            extensions: this.extensions,
            mimeTypes: this.mimeTypes,
            tooSmall: this.tooSmall,
            tooBig: this.tooBig,
            wrongExtension: this.wrongExtension,
            wrongMimeType: this.wrongMimeType
        };
    }
};