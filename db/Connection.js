'use strict';

const Base = require('../base/Component');

module.exports = class Connection extends Base {
    
    init () {
        super.init(this);
        this.drivers = Object.assign({
            mongodb: require('./MongoDriver'),
            mysql: require('./MysqlDriver')
        }, this.drivers);
        this.initDriver();
    }

    initDriver () {
        this.driver = this.driver || this.drivers[this.schema];
        if (!this.driver) {
            throw new Error(this.wrapClassMessage(`Unknown driver: ${this.schema}`));
        }
        this.driver = ClassHelper.createInstance(this.driver, {
            module: this.module,
            settings: this.settings
        });
    }

    configure (cb) {
        this.driver.open(cb);
    }
};

const ClassHelper = require('../helper/ClassHelper');