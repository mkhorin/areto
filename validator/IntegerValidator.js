/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./NumberValidator');

module.exports = class IntegerValidator extends Base {

    constructor (config) {
        super(config);
        this.integerOnly = true;
    }
};