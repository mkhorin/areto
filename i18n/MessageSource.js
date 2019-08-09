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
        this.clearCache();
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
        const key = `${language}/${category}`;
        if (!this._messages[key]) {
            this._messages[key] = this.loadMessages(category, language);
        }
        if (Object.prototype.hasOwnProperty.call(this._messages[key], message)) {
            return this._messages[key][message];
        }
        if (this.parent instanceof MessageSource) {
            return this.parent.translateMessage(message, category, language);
        }
        return null;
    }

    loadMessages () {
        throw new Error(this.wrapClassMessage('Load messages from store'));
    }

    clearCache () {
        this._messages = {};
    }

    log () {
        CommonHelper.log(this.i18n, this.constructor.name, ...arguments);
    }
};

const CommonHelper = require('../helper/CommonHelper');