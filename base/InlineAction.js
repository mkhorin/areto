'use strict';

const Base = require('./Action');

/**
 * action is defined as controller's method
 */
module.exports = class InlineAction extends Base {

    execute (cb) {
        try {
            this.callback = cb;
            this.method.call(this.controller);
        } catch (err) {
            cb(err);
        }
    }
};