/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class MessageSource extends Base {

    /**
     * @param {Object} config
     * @param {boolean} config.forceTranslation - Translate source language
     */
    constructor (config) {
        super({
            forceTranslation: false,
            sourceLanguage: config.i18n.sourceLanguage,
            ...config
        });
        this._messages = {};
    }

    async load () {
        throw new Error('Load messages from storage');
    }

    setParent (parent) {
        this.parent = parent;
        if (parent) {
            this.forceTranslationParent = parent.forceTranslation
                ? parent
                : parent.forceTranslationParent
        } else {
            this.forceTranslationParent = null;
        }
    }

    translate (message, language) {
        const data = this._messages[language];
        if (data && Object.hasOwn(data, message)) {
            return data[message];
        }
        return this.parent?.translate(message, language);
    }

    log () {
        CommonHelper.log(this.i18n, this.constructor.name, ...arguments);
    }
};

const CommonHelper = require('../helper/CommonHelper');