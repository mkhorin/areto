/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Behavior');

module.exports = class OrderBehavior extends Base {

    constructor (config) {
        super({
            'orderAttr': 'orderNumber',
            'start': 10,
            'step': 10,
            'filter': null,
            ...config
        });        
        this.setHandler(ActiveRecord.EVENT_BEFORE_INSERT, this.beforeInsert);
    }

    async beforeInsert (event) {
        if (CommonHelper.isEmpty(this.owner.get(this.orderAttr))) {
            this.owner.set(this.orderAttr, await this.getNextOrderNumber());
        }
    }

    async getNextOrderNumber () {
        let query = this.owner.constructor.find();
        if (this.filter instanceof Function) {
            this.filter(query, this.owner);
        } else if (typeof this.filter === 'string') {
            query.and({[this.filter]: this.owner.get(this.filter)});
        }
        query.order({[this.orderAttr]: this.step > 0 ? -1 : 1});
        let last = await query.scalar(this.orderAttr);
        return CommonHelper.isEmpty(last)
            ? this.start
            : (parseInt(last) + this.step);
    }

    async updateAll (ids) {
        if (!Array.isArray(ids)) {
            return;
        }
        let index = 0;
        let map = await this.owner.findById(ids).select(this.orderAttr).index(this.owner.PK).asRaw().all();
        for (let id of ids) {
            let pos = ++index * this.step;
            if (map.hasOwnProperty(id) && map[id][this.orderAttr] !== pos) {
                await this.owner.findById(id).update({[this.orderAttr]: pos});
            }
        }
    }
};

const CommonHelper = require('../helper/CommonHelper');
const ActiveRecord = require('../db/ActiveRecord');