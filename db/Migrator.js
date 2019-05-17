/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Migrator extends Base {

    constructor (config) {
        super({
            // module: application
            // connection: connection
            ...config
        });
    }

    getDb (connection) {
        return this.module.getDb(connection || this.connection);
    }

    getPath (...args) {
        return this.module.getPath(...args);
    }

    async migrate (action, files) {
        if (action !== 'apply' && action !== 'revert') {
            throw new Error(`Migration action (apply/revert) is not set: ${action}`);
        }
        if (!Array.isArray(files)) {
            return this.createMigration(files, action);
        }
        for (let file of files) {
            await this.createMigration(file, action);
        }
    }

    async createMigration (file, action) {
        this.log('info', `Start to ${action}: ${file}`);
        let Migration = require(this.getPath(file));
        let migration = this.spawn(Migration, {migrator: this});
        await migration[action]();
        this.log('info', `Done: ${file}`);
    }

    log (type, message, data) {
        CommonHelper.log(type, message, data, this.constructor.name, this.module);
    }
};

const CommonHelper = require('../helper/CommonHelper');
