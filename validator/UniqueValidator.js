/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./ExistValidator');

module.exports = class UniqueValidator extends Base {

    getMessage () {
        return this.createMessage(this.message, 'Value has already been taken');
    }

    async validateAttr (model, attr) {
        let targetClass = this.targetClass || model.constructor;
        let values = this.resolveValues(model, attr);
        let query = this.createQuery(values, model, attr);
        let ids = await query.limit(2).column(targetClass.PK);
        if (this.checkExist(ids, model, targetClass)) {
            this.addError(model, attr, this.getMessage());
        }
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

const MongoHelper = require('../helper/MongoHelper');