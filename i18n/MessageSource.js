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
        let key = `${language}/${category}`;
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

    loadMessages (category, language) {
        throw new Error(this.wrapClassMessage('Load message translation from the store'));
    }

    clearCache () {
        this._messages = {};
    }

    log (type, message, data) {
        CommonHelper.log(type, message, data, this.constructor.name, this.i18n);
    }
};

const CommonHelper = require('../helper/CommonHelper');