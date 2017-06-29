'use strict';

const Base = require('../base/Behavior');

module.exports = class OrderBehavior extends Base {

    constructor (config) {
        super(Object.assign({
            orderAttr: 'order',
            start: 1,
            step: 1,
            filter: null
        }, config));
    }

    init () {
        super.init();
        this._events[ActiveRecord.EVENT_BEFORE_INSERT] = 'beforeInsert';
    }

    beforeInsert (event, cb) {
        if (!MainHelper.isEmpty(this.owner.get(this.orderAttr))) {
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
                query.orderBy({[this.orderAttr]: this.step > 0 ? -1 : 1});
                query.scalar(this.orderAttr, cb);
            },
            (last, cb)=> {
                cb(null, MainHelper.isEmpty(last) ? this.start : (parseInt(last) + this.step));
            }
        ], cb);
    }
};

const async = require('async');
const ActiveRecord = require('../db/ActiveRecord');
const MainHelper = require('../helpers/MainHelper');