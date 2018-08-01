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

    getMessage () {
        return this.createMessage(this.message, 'Invalid file');
    }

    getNotImageMessage () {
        return this.createMessage(this.notImage, 'File is not an image');
    }

    getTooSmallMessage () {
        return this.createMessage(this.tooSmall, 'File size cannot be smaller than {limit}', {
            limit: [this.minSize, 'bytes']
        });
    }

    getTooBigMessage () {
        return this.createMessage(this.tooBig, 'File size cannot exceed {limit}', {
            limit: [this.maxSize, 'bytes']
        });
    }

    getWrongExtensionMessage () {
        return this.createMessage(this.wrongExtension, 'Only these file extensions are allowed: {extensions}', {
            extensions: this.extensions
        });
    }

    getWrongMimeTypeMessage () {
        return this.createMessage(this.wrongMimeType, 'Only these file MIME types are allowed: {mimeTypes}', {
            mimeTypes: this.mimeTypes
        });
    }

    // file {  path, size, extension, mime }
    validateValue (file, cb) {
        if (!file || !file.path) {
            return cb(null, this.getMessage());
        }
        if (this.imageOnly && (!file.mime || file.mime.indexOf('image') !== 0)) {
            return cb(null, this.getNotImageMessage());
        }
        fs.stat(file.path, (err, stats)=> {
            if (err || !stats.isFile()) {
                return cb(null, this.getMessage());
            }
            if (this.minSize && file.size < this.minSize) {
                return cb(null, this.getTooSmallMessage());
            }
            if (this.maxSize && file.size > this.maxSize) {
                return cb(null, this.getTooBigMessage());
            }
            if (this.extensions instanceof Array
                && (!file.extension || !this.extensions.includes(file.extension.toLowerCase()))) {
                return cb(null, this.getWrongExtensionMessage());
            }
            if (this.mimeTypes instanceof Array && (!file.mime || !this.mimeTypes.includes(file.mime))) {
                return cb(null, this.getWrongMimeTypeMessage());
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