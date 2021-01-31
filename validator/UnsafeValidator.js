/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 *
 * Skip attribute loading
 */
'use strict';

const Base = require('./Validator');

module.exports = class UnsafeValidator extends Base {

    validateAttr () {
    }
};