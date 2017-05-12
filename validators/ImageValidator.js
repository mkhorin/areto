'use strict';

const Base = require('./FileValidator');
let gm = require('gm');

module.exports = class ImageValidator extends Base {

    constructor (config) {
        super(Object.assign({
            maxHeight: null,
            maxWidth: null,
            minHeight: null,
            minWidth: null
        }, config));
    }

    init () {
        super.init();
        this.createMessage('notImage', 'File is not an image');
        this.createMessage('overHeight', 'The height cannot be larger than {limit} px');
        this.createMessage('overWidth', 'The width cannot be larger than {limit} px');
        this.createMessage('underHeight', 'The height cannot be smaller than {limit} px');
        this.createMessage('underWidth', 'The width cannot be smaller than {limit} px');
    }

    validateValue (file, cb) {
       super.validateValue(file, (err, message, params)=> {
           err ? cb(err) 
               : message ? cb(err, message, params) 
                         : this.validateImage(file, cb);
       });
    }

    validateImage (file, cb) {
        let image = gm(file.path);
        image.size((err, size)=> {
            if (err) {
                return cb(null, this.notImage);
            } 
            if (this.minHeight && size.height < this.minHeight) {
                return cb(null, this.underHeight, { limit: this.minHeight });
            }
            if (this.minWidth && size.width < this.minWidth) {
                return cb(null, this.underWidth, { limit: this.minWidth });
            }
            if (this.maxHeight && size.height > this.maxHeight) {
                return cb(null, this.overHeight, { limit: this.maxHeight });
            }
            if (this.maxWidth && size.width > this.maxWidth) {
                return cb(null, this.overWidth, { limit: this.maxWidth });
            }
            cb();
        });
    }

    getParams () {
        return Object.assign(super.getParams(), {
            onlyImage: true,
            maxHeight: this.maxHeight,
            maxWidth: this.maxWidth,
            minHeight: this.minHeight,
            minWidth: this.minWidth,
            notImage: this.notImage,
            overHeight: this.overHeight,
            overWidth: this.overWidth,
            underHeight: this.underHeight,
            underWidth: this.underWidth
        });
    }
};