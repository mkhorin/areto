/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class QueryHelper {

    static getAttr (model, name) {
        return model instanceof ActiveRecord ? model.get(name) : model[name];
    }

    static indexObjects (docs, key) {
        const result = {};
        for (const doc of docs) {
            result[typeof key === 'function' ? key(doc) : doc[key]] = doc;
        }
        return result;
    }

    static indexModels (models, key) {
        const result = {};
        for (const model of models) {
            result[typeof key === 'function' ? key(model) : model.get(key)] = model;
        }
        return result;
    }

    static normalizeRelations (model, data) {
        const result = {};
        let tail, relation;
        for (let name of Object.keys(data)) {
            const value = data[name];
            const pos = name.indexOf('.');
            if (pos > 0) {
                tail = name.substring(pos + 1);
                name = name.substring(0, pos);
            }
            if (Object.prototype.hasOwnProperty.call(result, name)) {
                relation = result[name];
            } else {
                relation = model.getRelation(name);
                if (!relation) {
                    continue;
                }
                relation.primaryModel = null;
                result[name] = relation;
            }
            if (tail) { // sub-relations -> order.customer.address...
                relation.with({[tail]: value});
            } else if (typeof value === 'function') {
                value(relation);
            }
        }
        return result;
    }

    static unlinkInternal (ref, link, model, key) {
        if (Array.isArray(ref)) {
            const index = ArrayHelper.indexOf(link, ref);
            if (index !== - 1) {
                ref.splice(index, 1);
            }
        } else {
            model.set(key, null);
        }
        return model.forceSave();
    }
};

const ArrayHelper = require('./ArrayHelper');
const ActiveRecord = require('../db/ActiveRecord');