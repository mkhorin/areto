/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Message extends Base {

    constructor (message, source, params, language) {
        super({
            message,
            source,
            params, 
            language
        });
    }

    addParams (params) {
        this.params = Object.assign(this.params || {}, params);
        return this;
    }

    translate (i18n, language) {
        return this.source
            ? i18n.translate(this.message, this.source, this.params, this.language || language)
            : i18n.format(this.message, this.params, this.language || language);
    }

    toString () {
        return this.message;
    }
};