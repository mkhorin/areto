'use strict';

let Base = require('../base/Base');

module.exports = class MessageSource extends Base {

    constructor (config) {
        super(Object.assign({
            forceTranslation: false,
            sourceLanguage: config.i18n.sourceLanguage
        }, config));
    }

    init () {        
        this.clearCache();
    }

    clearCache () {
        this._messages = {};
    }

    loadMessages (category, language) {
        // what about ASYNC load
        throw new Error('Load the message translation from the storage');
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
        if (!(key in this._messages)) {
            this._messages[key] = this.loadMessages(category, language);
        }
        return message in this._messages[key]
            ? this._messages[key][message]
            : message;
    }
};