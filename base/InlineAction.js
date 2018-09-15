/**
 * @copyright Copyright (c) 2018 Maxim Khorin (maksimovichu@gmail.com)
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