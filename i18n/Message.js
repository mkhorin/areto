'use strict';

let Base = require('../base/Base');

module.exports = class Message extends Base {

    constructor (category, message, params, language) {
        super({category, message, params, language});
    }

    addParams (addon) {
        this.params = Object.assign(this.params || {}, addon);
    }
};

let I18n = require('./I18n');