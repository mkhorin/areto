'use strict';

const Base = require('./Validator');

module.exports = class FileValidator extends Base {

    constructor (config) {
        super(Object.assign({
            imageOnly: false,
            minSize: 1,
            maxSize: null,
            extensions: null,
            mimeTypes: null
        }, config));
    }

    init () {
        super.init();
        this.createMessage('message', 'Invalid file');
        this.createMessage('notImage', 'File is not an image');
        this.createMessage('tooSmall', 'File size cannot be smaller than {limit}');
        this.createMessage('tooBig', 'File size cannot exceed {limit}');
        this.createMessage('wrongExtension', 'Only these file extensions are allowed: {extensions}');
        this.createMessage('wrongMimeType', 'Only these file MIME types are allowed: {mimeTypes}');
    }

    // file {  path, size, extension, mime }
    validateValue (file, cb) {
        if (!file || !file.path) {
            return cb(null, this.message);
        }
        if (this.imageOnly && (!file.mime || file.mime.indexOf('image') !== 0)) {
            return cb(null, this.notImage);
        }
        fs.stat(file.path, (err, stats)=> {
            if (err || !stats.isFile()) {
                return cb(null, this.message);
            }
            if (this.minSize && file.size < this.minSize) {
                return cb(null, this.tooSmall, {
                    limit: [this.minSize, 'bytes']
                });
            }
            if (this.maxSize && file.size > this.maxSize) {
                return cb(null, this.tooBig, {
                    limit: [this.maxSize, 'bytes']
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
            imageOnly: this.imageOnly,
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

const fs = require('fs');