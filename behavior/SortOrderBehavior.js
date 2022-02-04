/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Behavior');

module.exports = class SortOrderBehavior extends Base {

    constructor (config) {
        super({
            orderAttr: 'orderNumber',
            start: 10,
            step: 10,
            filter: null,
            ...config
        });
        this.setHandler(ActiveRecord.EVENT_BEFORE_INSERT, this.beforeInsert);
    }

    async beforeInsert () {
        if (CommonHelper.isEmpty(this.owner.get(this.orderAttr))) {
            this.owner.set(this.orderAttr, await this.getNextNumber());
        }
    }

    async getNextNumber () {
        const query = this.owner.find();
        if (typeof this.filter === 'function') {
            this.filter(query, this.owner);
        } else if (typeof this.filter === 'string') {
            query.and({[this.filter]: this.owner.get(this.filter)});
        }
        const direction = this.step > 0 ? -1 : 1;
        const last = await query.order({[this.orderAttr]: direction}).scalar(this.orderAttr);
        return Number.isSafeInteger(last) ? last + this.step : this.start;
    }

    async update (data) {
        if (data) {
            for (const id of Object.keys(data)) {
                await this.updateById(id, data);
            }
        }
    }

    async updateById (id, data) {
        const model = await this.owner.findById(id).one();
        if (model) {
            model.set(this.orderAttr, data[id]);
            return model.update();
        }
    }
};

const CommonHelper = require('../helper/CommonHelper');
const ActiveRecord = require('../db/ActiveRecord');