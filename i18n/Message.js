'use strict';

const Base = require('../base/Base');

module.exports = class Message extends Base {

    constructor (category, message, params, language) {
        super({category, message, params, language});
    }

    addParams (params) {
        this.params = Object.assign(this.params || {}, params);
        return this;
    }

    translate (i18n, language) {
        return this.category
            ? i18n.translate(this.category, this.message, this.params, language || this.language)
            : i18n.format(this.message, this.params, language || this.language);
    }

    toString () {
        return this.message;
    }
};