/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./MessageSource');

module.exports = class JsMessageSource extends Base {

    constructor (config) {
        super({
            // basePath: [string] or [function]
            ...config
        })
    }

    loadMessages (category, language) {
        let type = typeof this.basePath, data, error;
        try {
            if (type === 'string') {
                data = require(path.join(this.basePath, language, category));
            } else if (type === 'function') {
                data = this.basePath(language, category);
            } else {
                data = this.requireMessages(language, category);
            }
        } catch (err) {
            error = err;
        }
        if (data) {
            return data;
        }
        this.log('warn', `Message load failed: ${language}: ${category}`, error);
        return {};
    }

    requireMessages (language, category) {
        return this.i18n.module.require('message', language, category);
    }
};

const path = require('path');