/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';
/**
 * attr must exist
 * ['attr', 'exist']
 * attr must exist, but its value will use attr2 to check for existence
 * ['attr', 'exist', {targetAttr: 'attr2'}]
 * attr1 and attr2 must exist together, and they both will receive error message
 * [['attr1', 'attr2'], 'exist', {targetAttr: ['attr1', 'attr2']}]
 * attr1 and attr2 must exist together, only attr1 will receive error message
 * ['attr1', 'exist', {targetAttr: ['attr1', 'attr2']}]
 */
const Base = require('./Validator');

module.exports = class ExistValidator extends Base {

    /**
     * @param {Object} config
     * @param {string|string[]} config.targetAttr - Target attribute name or names
     */
    constructor (config) {
        super({
            targetClass: null,
            targetAttr: null,
            filter: null,
            ignoreCase: false,
            ...config
        });
    }

    getMessage () {
        return this.createMessage(this.message, 'Value does not exist');
    }

    async validateAttr (attr, model) {
        const values = this.resolveValues(attr, model);
        const query = this.createQuery(values, attr, model);
        if (!await query.count()) {
            this.addError(model, attr, this.getMessage());
        }
    }

    resolveValues (attr, model) {
        const values = {};
        const targetAttr = this.targetAttr || attr;
        if (Array.isArray(targetAttr)) {
            for (const name of targetAttr) {
                values[name] = model.get(attr);
            }
        } else {
            values[targetAttr] = model.get(attr);
        }
        return values;
    }

    createQuery (values, attr, model) {
        const queryModel = this.targetClass ? model.spawn(this.targetClass) : model;
        const query = queryModel.find();
        if (this.ignoreCase) {
            for (const name of Object.keys(values)) {
                query.and(['LIKE', name, values[name]]);
            }
        } else {
            query.and(values);
        }
        if (typeof this.filter === 'function') {
            this.filter(query, model, attr);
        } else if (typeof this.filter === 'string') {
            query.and({[this.filter]: model.get(this.filter)});
        } else if (this.filter) {
            query.and(this.filter);
        }
        return query;
    }
};
