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
        const order = this.owner.get(this.orderAttr);
        if (CommonHelper.isEmpty(order)) {
            const next = await this.getNextNumber();
            this.owner.set(this.orderAttr, next);
        }
    }

    async getNextNumber () {
        const query = this.owner.find();
        if (typeof this.filter === 'function') {
            this.filter(query, this.owner);
        } else if (typeof this.filter === 'string') {
            const value = this.owner.get(this.filter);
            query.and({[this.filter]: value});
        }
        const direction = this.step > 0 ? -1 : 1;
        const order = {[this.orderAttr]: direction};
        const last = await query.order(order).scalar(this.orderAttr);
        return Number.isSafeInteger(last)
            ? last + this.step
            : this.start;
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