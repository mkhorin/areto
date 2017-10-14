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
};