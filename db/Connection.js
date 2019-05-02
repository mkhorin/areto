/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class Connection extends Base {
    
    constructor (config) {
        super(config);
        this.drivers = {
            'mongodb': require('./MongoDriver'),
            'mysql': require('./MysqlDriver'),
            ...this.drivers
        };
    }

    init () {
        this.driver = this.createDriver(this.driver || this.drivers[this.schema]);
    }

    createDriver (driver) {
        if (!driver) {
            throw new Error(this.wrapClassMessage(`Unknown driver: ${this.schema}`));
        }
        return ClassHelper.spawn(driver, {
            'module': this.module,
            'settings': this.settings
        });
    }
};

const ClassHelper = require('../helper/ClassHelper');