'use strict';

const Base = require('./FileValidator');

module.exports = class ImageValidator extends Base {

    constructor (config) {
        super(Object.assign({
            maxHeight: null,
            maxWidth: null,
            minHeight: null,
            minWidth: null
        }, config));
    }

    getOverHeightMessage () {
        return this.createMessage(this.overHeight, 'The height cannot be larger than {limit} px', {
            limit: this.maxHeight
        });
    }

    getOverWidthMessage () {
        return this.createMessage(this.overWidth, 'The width cannot be larger than {limit} px', {
            limit: this.maxWidth
        });
    }

    getUnderHeightMessage () {
        return this.createMessage(this.underHeight, 'The height cannot be smaller than {limit} px', {
            limit: this.minHeight
        });
    }

    getUnderWidthMessage () {
        return this.createMessage(this.underWidth, 'The width cannot be smaller than {limit} px', {
            limit: this.minWidth
        });
    }

    async validateValue (file) {
        return await super.validateValue(file) || await this.validateImage(file);
    }

    async validateImage (file) {
        let image = gm(file.path);
        try {
            let size = await PromiseHelper.promise(image.size.bind(image));
            if (this.minHeight && size.height < this.minHeight) {
                return this.getUnderHeightMessage();
            }
            if (this.minWidth && size.width < this.minWidth) {
                return this.getUnderWidthMessage();
            }
            if (this.maxHeight && size.height > this.maxHeight) {
                return this.getOverHeightMessage();
            }
            if (this.maxWidth && size.width > this.maxWidth) {
                return this.getOverWidthMessage();
            }
        } catch (err) {
            return this.getNotImageMessage();
        }
    }

    getParams () {
        return Object.assign(super.getParams(), {
            'imageOnly': true,
            'maxHeight': this.maxHeight,
            'maxWidth': this.maxWidth,
            'minHeight': this.minHeight,
            'minWidth': this.minWidth,
            'notImage': this.notImage,
            'overHeight': this.overHeight,
            'overWidth': this.overWidth,
            'underHeight': this.underHeight,
            'underWidth': this.underWidth
        });
    }
};

const gm = require('gm');
const PromiseHelper = require('../helper/PromiseHelper');