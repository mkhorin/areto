'use strict';

let Base = require('./MessageSource');
let path = require('path');

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
            this.i18n.module.log('error', 'JsMessageSource: loadMessages', err);
            return {};
        }
    }
};