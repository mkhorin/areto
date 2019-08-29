/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class MessageSource extends Base {

    constructor (config) {
        super({
            forceTranslation: false,
            sourceLanguage: config.i18n.sourceLanguage,
            parent: null,
            ...config
        });
        this._messages = {};
    }

    async load () {
        throw new Error(this.wrapClassMessage('Load messages from store'));
    }

    translate (message, category, language) {
        return this.forceTranslation || language !== this.sourceLanguage
            ? this.translateMessage(message, category, language)
            : null;
    }

    translateMessage (message, category, language) {
        if (!category) {
            return null;
        }
        const data = this._messages[`${language}/${category}`];
        if (data && Object.prototype.hasOwnProperty.call(data, message)) {
            return data[message];
        }
        if (this.parent) {
            return this.parent.translateMessage(message, category, language);
        }
        return null;
    }

    log () {
        CommonHelper.log(this.i18n, this.constructor.name, ...arguments);
    }
};

const CommonHelper = require('../helper/CommonHelper');