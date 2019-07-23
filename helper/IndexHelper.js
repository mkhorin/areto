/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class IndexHelper {

    static indexObjects (docs, keyProp, valueProp) {
        let result = {};
        if (!Array.isArray(docs)) {
            return result;
        }
        for (let doc of docs) {
            if (doc === null || doc === undefined) {
                continue;
            }
            let value = valueProp === undefined ? doc : doc[valueProp];
            let key = doc[keyProp];
            if (!Object.prototype.hasOwnProperty.call(result, key)) {
                result[key] = value;
            } else if (Array.isArray(result[key])) {
                result[key].push(value);
            } else {
                result[key] = [result[key], value];
            }
        }
        return result;
    }

    static indexUniqueKeyObjects (items, keyProp, valueProp) {
        let result = {};
        if (!Array.isArray(items)) {
            return result;
        }
        for (let item of items) {
            if (item !== null && item !== undefined) {
                result[item[keyProp]] = valueProp === undefined ? item : item[valueProp];
            }
        }
        return result;
    }

    static indexModels (models, keyAttr, valueAttr) {
        let result = {};
        if (!Array.isArray(models)) {
            return result;
        }
        for (let model of models) {
            let value = valueAttr ? model.get(valueAttr) : model;
            let key = model.get(keyAttr);
            if (!Object.prototype.hasOwnProperty.call(result, key)) {
                result[key] = value;
            } else if (Array.isArray(result[key])) {
                result[key].push(value);
            } else {
                result[key] = [result[key], value];
            }
        }
        return result;
    }

    static indexUniqueKeyModels (models, keyAttr, valueAttr) {
        let result = {};
        if (!Array.isArray(models)) {
            return result;
        }
        for (let model of models) {
            result[model.get(keyAttr)] = valueAttr ? model.get(valueAttr) : model;
        }
        return result;
    }
};