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
    }

    init () {
        super.init();
        this.assign(ActiveRecord.EVENT_BEFORE_INSERT, this.beforeInsert);
    }

    beforeInsert (event, cb) {
        if (!MiscHelper.isEmpty(this.owner.get(this.orderAttr))) {
            return cb();
        }
        async.waterfall([
            this.findNextOrder.bind(this),
            (order, cb)=> {
                this.owner.set(this.orderAttr, order);
                cb();
            }
        ], cb);
    }

    findNextOrder (cb) {
        async.waterfall([
            cb => {
                let query = this.owner.constructor.find();
                if (this.filter instanceof Function) {
                    this.filter(query, this.owner);
                } else if (typeof this.filter === 'string') {
                    query.where({[this.filter]: this.owner.get(this.filter)});
                }
                query.order({[this.orderAttr]: this.step > 0 ? -1 : 1});
                query.scalar(this.orderAttr, cb);
            },
            (last, cb)=> {
                cb(null, MiscHelper.isEmpty(last) ? this.start : (parseInt(last) + this.step));
            }
        ], cb);
    }

    updateAllByIds (ids, cb) {
        let index = 0;
        async.waterfall([
            cb => this.owner.findById(ids).index(this.owner.PK).all(cb),
            (map, cb)=> async.eachSeries(ids, (id, cb)=> {
                if (!(map[id] instanceof this.owner.constructor)) {
                    return cb();
                }
                map[id].set(this.orderAttr, ++index * this.step);
                map[id].forceSave(cb);
            }, cb)
        ], cb);
    }
};

const async = require('async');
const ActiveRecord = require('../db/ActiveRecord');
const MiscHelper = require('../helpers/MiscHelper');