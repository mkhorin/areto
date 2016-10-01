'use strict';

let Base = require('./Validator');
let fs = require('fs');

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
                cb(null, this.message);
            } else if (this.onlyImage && (!file.mime || file.mime.indexOf('image') !== 0)) {
                cb(null, this.notImage);                
            } else if (this.minSize && file.size < this.minSize) {
                cb(null, this.tooSmall, { limit: this.minSize });
            } else if (this.maxSize && file.size > this.maxSize) {
                cb(null, this.tooBig, { limit: this.maxSize });
            } else if (this.extensions 
                && (!file.extension || this.extensions.indexOf(file.extension.toLowerCase()) < 0)) {                
                cb(null, this.wrongExtension, { extensions: this.extensions });
            } else if (this.mimeTypes && (!file.mime || this.mimeTypes.indexOf(file.mime) < 0)) {
                cb(null, this.wrongMimeType, { mimeTypes: this.mimeTypes });
            } else {
                cb();    
            }
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