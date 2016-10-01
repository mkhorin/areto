'use strict';

let Base = require('./FileValidator');
let gm = require('gm');

module.exports = class ImageValidator extends Base {

    constructor (config) {
        super(Object.assign({
            onlyImage: true,
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
           err ? cb(err) : message ? cb(err, message, params) : this.validateImage(file, cb);
       });
    }

    validateImage (file, cb) {
        let image = gm(file.path);
        image.size((err, size)=> {
            if (err) {
                cb(null, this.onlyImage ? this.notImage : null);
            } else if (this.minHeight && size.height < this.minHeight) {
                cb(null, this.underHeight, { limit: this.minHeight });
            } else if (this.minWidth && size.width < this.minWidth) {
                cb(null, this.underWidth, { limit: this.minWidth });
            } else if (this.maxHeight && size.height > this.maxHeight) {
                cb(null, this.overHeight, { limit: this.maxHeight });
            } else if (this.maxWidth && size.width > this.maxWidth) {
                cb(null, this.overWidth, { limit: this.maxWidth });
            } else {
                cb();
            }
        });
    }

    getParams () {
        return Object.assign(super.getParams(), {
            onlyImage: this.onlyImage,
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