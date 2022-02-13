/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Migrator extends Base {

    /**
     * @param {Object} config
     * @param {string} config.module - Application instance
     */
    constructor (config) {
        super(config);
    }

    getDb (id) {
        return this.module.getDb(id || this.db);
    }

    getPath () {
        return this.module.getPath(...arguments);
    }

    async migrate (action, files) {
        if (action !== 'apply' && action !== 'revert') {
            throw new Error(`Migration action (apply/revert) is not set: ${action}`);
        }
        if (!Array.isArray(files)) {
            return this.createMigration(files, action);
        }
        for (const file of files) {
            await this.createMigration(file, action);
        }
    }

    async createMigration (file, action) {
        this.log('info', `Start to ${action}: ${file}`);
        const Migration = require(this.getPath(file));
        const migration = this.spawn(Migration, {migrator: this});
        await migration[action]();
        this.log('info', `Done: ${file}`);
    }

    log () {
        CommonHelper.log(this.module, this.constructor.name, ...arguments);
    }
};

const CommonHelper = require('../helper/CommonHelper');
