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
            // parent: 'app', // parent source
            ...config
        });
        this._messages = {};
    }

    async load () {
        throw new Error('Load messages from storage');
    }

    translate (message, language) {
        const data = this._messages[language];
        if (data && Object.prototype.hasOwnProperty.call(data, message)) {
            return data[message];
        }
        return this.parent ? this.parent.translate(message, language) : null;
    }

    log () {
        CommonHelper.log(this.i18n, this.constructor.name, ...arguments);
    }
};

const CommonHelper = require('../helper/CommonHelper');