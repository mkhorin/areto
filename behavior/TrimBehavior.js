/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Behavior');

module.exports = class TrimBehavior extends Base {

    constructor (config) {
        super({
            // attrs: []
            ...config
        });
        this.setHandler(ActiveRecord.EVENT_BEFORE_VALIDATE, this.beforeValidate);
    }

    beforeValidate () {
        for (const attr of this.attrs) {
            const value = this.owner.get(attr);
            if (value && typeof value === 'string') {
                this.owner.set(attr, value.trim());
            }
        }
    }
};

const ActiveRecord = require('../db/ActiveRecord');