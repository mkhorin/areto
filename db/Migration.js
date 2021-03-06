/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Migration extends Base {

    constructor (config) {
        super({
            // migrator: [migrator]
            ...config
        });
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