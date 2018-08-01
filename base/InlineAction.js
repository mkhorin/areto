'use strict';

const Base = require('./Action');

/**
 * action is defined as controller's method
 */
module.exports = class InlineAction extends Base {

    run () {
        this.method.call(this.controller);
    }
};