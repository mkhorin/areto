/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Action');

/**
 * action is defined as controller's method
 */
module.exports = class InlineAction extends Base {

    execute () {
        return this.method.call(this.controller);
    }
};