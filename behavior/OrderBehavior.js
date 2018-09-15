/**
 * @copyright Copyright (c) 2018 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('../base/Behavior');

module.exports = class OrderBehavior extends Base {

    constructor (config) {
        super(Object.assign({
            orderAttr: 'order',
            start: 10,
            step: 10,
            filter: null
        }, config)); 
        
        this.assign(ActiveRecord.EVENT_BEFORE_INSERT, this.beforeInsert);
    }

    async beforeInsert (event) {
        if (CommonHelper.isEmpty(this.owner.get(this.orderAttr))) {
            this.owner.set(this.orderAttr, await this.findNextOrder());
        }
    }

    async findNextOrder () {
        let query = this.owner.constructor.find();
        if (this.filter instanceof Function) {
            this.filter(query, this.owner);
        } else if (typeof this.filter === 'string') {
            query.and({[this.filter]: this.owner.get(this.filter)});
        }
        query.order({
            [this.orderAttr]: this.step > 0 ? -1 : 1
        });
        let last = await query.scalar(this.orderAttr);
        return CommonHelper.isEmpty(last)
            ? this.start
            : (parseInt(last) + this.step);
    }

    async updateAllByIds (ids) {
        if (!(ids instanceof Array)) {
            return;
        }
        let map = await this.owner.findById(ids).index(this.owner.PK).all();
        let index = 0;
        for (let id of ids) {
            if (map[id] instanceof this.owner.constructor) {
                map[id].set(this.orderAttr, ++index * this.step);
                await map[id].forceSave();
            }
        }
    }
};

const CommonHelper = require('../helper/CommonHelper');
const ActiveRecord = require('../db/ActiveRecord');