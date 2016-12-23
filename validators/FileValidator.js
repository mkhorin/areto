'use strict';

const Base = require('./Validator');
const fs = require('fs');

module.exports = class FileValidator extends Base {

    constructor (config) {
        super(Object.assign({
            minSize: 1,
            maxSize: 10000000,
            extensions: null,
            mimeTypes: null,
            onlyImage: false
        }, config));
    }

    init () {
        super.init();
        this.createMessage('message', 'Invalid file');
        this.createMessage('tooSmall', 'File size cannot be smaller than {limit} B');
        this.createMessage('tooBig', 'File size cannot exceed {limit} B');
        this.createMessage('wrongExtension', 'Only these file extensions are allowed: {extensions}');
        this.createMessage('wrongMimeType', 'Only these file MIME types are allowed: {mimeTypes}');
        this.createMessage('notImage', 'File is not an image');
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
            if (this.onlyImage && (!file.mime || file.mime.indexOf('image') !== 0)) {
                return cb(null, this.notImage);                
            }
            if (this.minSize && file.size < this.minSize) {
                return cb(null, this.tooSmall, { limit: this.minSize });
            }
            if (this.maxSize && file.size > this.maxSize) {
                return cb(null, this.tooBig, { limit: this.maxSize });
            }
            if (this.extensions && (!file.extension || this.extensions.indexOf(file.extension.toLowerCase()) < 0)) {
                return cb(null, this.wrongExtension, { extensions: this.extensions });
            }
            if (this.mimeTypes && (!file.mime || this.mimeTypes.indexOf(file.mime) < 0)) {
                return cb(null, this.wrongMimeType, { mimeTypes: this.mimeTypes });
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