'use strict';

const Base = require('./ExistValidator');

module.exports = class UniqueValidator extends Base {

    getMessage () {
        return this.createMessage(this.message, 'Value has already been taken');
    }

    validateAttr (model, attr, cb) {
        let targetClass = this.targetClass || model.constructor;
        AsyncHelper.waterfall([
            cb => this.resolveValues(model, attr, cb),
            (values, cb)=> this.createQuery(values, model, attr, cb),
            (query, cb)=> query.limit(2).column(targetClass.PK, cb),
            (ids, cb)=> {
                if (this.checkExist(ids, model, targetClass)) {
                    this.addError(model, attr, this.getMessage());
                }
                cb();
            }
        ], cb);
    }

    checkExist (ids, model, targetClass) {
        if (ids.length === 1) {
            if (targetClass === model.constructor) {
                return !model.getId() || !MongoHelper.isEqual(model.getId(), ids[0]);
            }
        } else if (ids.length === 0) {
            return false;
        }
        return true;
    }
};

const AsyncHelper = require('../helper/AsyncHelper');
const MongoHelper = require('../helper/MongoHelper');