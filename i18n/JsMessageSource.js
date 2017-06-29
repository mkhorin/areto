'use strict';

const Base = require('./MessageSource');

module.exports = class JsMessageSource extends Base {

    constructor (config) {
        super(Object.assign({
            basePath: config.i18n.basePath
        }, config));
    }
    
    loadMessages (category, language) {
        try {
            return require(path.join(this.basePath, language, category));
        } catch (err) {
            this.i18n.module.log('error', `${this.constructor.name}: loadMessages`, err);
            return {};
        }
    }
};

const path = require('path');