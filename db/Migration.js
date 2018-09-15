/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class Migration extends Base {

    constructor (config) {
        super(config);
        this.db = this.db || this.module.getDb();
    }

    apply () {
        throw new Error('Need to override');
    }

    revert () {
        throw new Error('Need to override');
    }
};