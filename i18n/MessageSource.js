'use strict';

const Base = require('../base/Base');

module.exports = class MessageSource extends Base {

    constructor (config) {
        super(Object.assign({
            forceTranslation: false,
            sourceLanguage: config.i18n.sourceLanguage,
            parent: null
        }, config));
    }

    init () {
        this.clearCache();
    }

    translate (category, message, language) {
        return this.forceTranslation || language !== this.sourceLanguage
            ? this.translateMessage(category, message, language)
            : message;
    }

    translateMessage (category, message, language) {
        if (!category) {
            return message;
        }
        let key = `${language}/${category}`;
        if (!this._messages[key]) {
            this._messages[key] = this.loadMessages(category, language);
        }
        if (Object.prototype.hasOwnProperty.call(this._messages[key], message)) {
            return this._messages[key][message];
        }
        if (this.parent instanceof MessageSource) {
            return this.parent.translateMessage(category, message, language);
        }
        return message;
    }

    loadMessages (category, language) {
        throw new Error(`${this.constructor.name}: Load message translation from the store`);
    }

    clearCache () {
        this._messages = {};
    }

    log () {
        this.i18n.log.apply(this.i18n, arguments);
    }
};