'use strict';

let Base = require('../base/ExtEvent');

module.exports = class UserEvent extends Base {

    constructor (config) {
        super(Object.assign({
            identity: null,
            cookieBased: null,
            duration: null
        }, config));
    }
};