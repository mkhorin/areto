'use strict';

let Base = require('./Action');

/**
 * action is defined as controller's method
 */
module.exports = class InlineAction extends Base {

    execute (cb) {
        try {
            this.callback = cb;
            this.controller[this.method].call(this.controller);
        } catch (err) {
            cb(err);
        }
    }
};