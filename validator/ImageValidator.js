/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./FileValidator');

module.exports = class ImageValidator extends Base {

    constructor (config) {
        super({
            maxHeight: null,
            maxWidth: null,
            minHeight: null,
            minWidth: null,
            ...config
        });
    }

    getOverHeightMessage () {
        return this.createMessage(this.overHeight, 'Height cannot be larger than {limit} px', {
            limit: this.maxHeight
        });
    }

    getOverWidthMessage () {
        return this.createMessage(this.overWidth, 'Width cannot be larger than {limit} px', {
            limit: this.maxWidth
        });
    }

    getUnderHeightMessage () {
        return this.createMessage(this.underHeight, 'Height cannot be smaller than {limit} px', {
            limit: this.minHeight
        });
    }

    getUnderWidthMessage () {
        return this.createMessage(this.underWidth, 'Width cannot be smaller than {limit} px', {
            limit: this.minWidth
        });
    }

    async validateValue (file) {
        return await super.validateValue(file) || await this.validateImage(file);
    }

    async validateImage (file) {
        const sharp = require('sharp');
        try {
            const image = sharp(file.path);
            const data = await image.metadata();
            if (this.minHeight && data.height < data.minHeight) {
                return this.getUnderHeightMessage();
            }
            if (this.minWidth && data.width < this.minWidth) {
                return this.getUnderWidthMessage();
            }
            if (this.maxHeight && data.height > this.maxHeight) {
                return this.getOverHeightMessage();
            }
            if (this.maxWidth && data.width > this.maxWidth) {
                return this.getOverWidthMessage();
            }
        } catch {
            return this.getNotImageMessage();
        }
    }

    getParams () {
        return Object.assign(super.getParams(), {
            imageOnly: true,
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