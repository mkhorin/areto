/**
 * @copyright Copyright (c) 2018 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

module.exports = class QueryHelper {

    static getAttr (model, name) {
        return model instanceof ActiveRecord ? model.get(name) : model[name];
    }

    static indexObjects (docs, data) {
        let result = {};
        for (let doc of docs) {
            let key = typeof data === 'function' ? data(doc) : doc[data];
            result[key] = doc;
        }
        return result;
    }

    static indexModels (models, data) {
        let result = {};
        for (let model of models) {
            let key = typeof data === 'function' ? data(model) : model.get(data);
            result[key] = model;
        }
        return result;
    }

    static normalizeRelations (model, relations) {
        let result = {}, relation;
        for (let name in relations) {
            if (Object.prototype.hasOwnProperty.call(relations, name)) {
                [name, relation] = this.normalizeRelation(name, relations[name], model);
                if (relation) {
                    result[name] = relation;
                }
            }
        }
        return result;
    }

    static normalizeRelation (name, handler, model) {
        let pos = name.indexOf('.'), childName;
        if (pos > 0) {
            childName = name.substring(pos + 1);
            name = name.substring(0, pos);
        }
        let relation = model.getRelation(name);
        if (!relation) {
            return [];
        }
        relation.primaryModel = null;
        if (childName) { // sub-relations -> order.customer.address...
            relation._with[childName] = handler;
        } else if (handler) {
            handler(relation);
        }
        return [name, relation];
    }

};

const ActiveRecord = require('../db/ActiveRecord');