/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Migration extends Base {

    /**
     * @param {Object} config
     * @param {Object} config.migrator - Migrator instance
     */
    constructor (config) {
        super(config);
    }

    getDb (id) {
        return this.migrator.getDb(id || this.db);
    }

    apply () {
        throw new Error('Need to override');
    }

    revert () {
        throw new Error('Need to override');
    }
};