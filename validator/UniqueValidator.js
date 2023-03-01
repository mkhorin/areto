/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./ExistValidator');

module.exports = class UniqueValidator extends Base {

    getMessage () {
        return this.createMessage(this.message, 'Value has already been taken');
    }

    async validateAttr (attr, model) {
        const targetClass = this.targetClass || model.constructor;
        const values = this.resolveValues(attr, model);
        const query = this.createQuery(values, attr, model).limit(2);
        const ids = await query.column(targetClass.PK);
        if (this.checkExists(ids, model, targetClass)) {
            this.addError(model, attr, this.getMessage());
        }
    }

    checkExists (ids, model, targetClass) {
        if (ids.length === 1) {
            if (targetClass === model.constructor) {
                const id = model.getId();
                return !id || !CommonHelper.isEqual(id, ids[0]);
            }
        } else if (ids.length === 0) {
            return false;
        }
        return true;
    }
};

const CommonHelper = require('../helper/CommonHelper');