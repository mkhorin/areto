'use strict';

const Base = require('./Validator');
/**
 * a1 needs to exist
 * ['a1', 'exist']
 * a1 needs to exist, but its value will use a2 to check for the existence
 * ['a1', 'exist', {targetAttr: 'a2'}]
 * a1 and a2 need to exist together, and they both will receive error message
 * [['a1', 'a2'], 'exist', {targetAttr: ['a1', 'a2']}]
 * a1 and a2 need to exist together, only a1 will receive error message
 * ['a1', 'exist', {targetAttr: ['a1', 'a2']}]
 */
module.exports = class ExistValidator extends Base {

    constructor (config) {
        super(Object.assign({
            targetClass: null,
            targetAttr: null, // can be array
            filter: null,
            ignoreCase: false
        }, config));
    }

    getMessage () {
        return this.createMessage(this.message, 'Value does not exist');
    }

    validateAttr (model, attr, cb) {
        AsyncHelper.waterfall([
            cb => this.resolveValues(model, attr, cb),
            (values, cb)=> this.createQuery(values, model, attr, cb),
            (query, cb)=> query.count(cb),
            (counter, cb)=> {
                !counter && this.addError(model, attr, this.getMessage());
                cb();
            }
        ], cb);
    }

    resolveValues (model, attr, cb) {
        let values = {};
        let targetAttr = this.targetAttr || attr;
        if (targetAttr instanceof Array) {
            for (let name of targetAttr) {
                values[targetAttr] = model.get(attr);
            }
        } else {
            values[targetAttr] = model.get(attr);
        }
        cb(null, values);
    }

    createQuery (values, model, attr, cb) {
        let query = (this.targetClass || model.constructor).find();
        if (this.ignoreCase) {
            for (let name of Object.keys(values)) {
                query.and(['LIKE', name, values[name]]);
            }
        } else {
            query.and(values);
        }
        if (typeof this.filter === 'function') {
            this.filter(query, model, attr);
        } else if (this.filter) {
            query.and(this.filter);
        }
        cb(null, query);
    }
};

const AsyncHelper = require('../helpers/AsyncHelper');