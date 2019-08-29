/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class IndexHelper {

    static indexObjects (docs, keyProperty, valueProperty) {
        const result = {};
        if (!Array.isArray(docs)) {
            return result;
        }
        for (const doc of docs) {
            if (doc === null || doc === undefined) {
                continue;
            }
            const value = valueProperty === undefined ? doc : doc[valueProperty];
            const key = doc[keyProperty];
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

    static indexUniqueKeyObjects (items, keyProperty, valueProperty) {
        const result = {};
        if (!Array.isArray(items)) {
            return result;
        }
        for (const item of items) {
            if (item !== null && item !== undefined) {
                result[item[keyProperty]] = valueProperty === undefined ? item : item[valueProperty];
            }
        }
        return result;
    }

    static indexModels (models, keyAttr, valueAttr) {
        const result = {};
        if (!Array.isArray(models)) {
            return result;
        }
        for (const model of models) {
            const value = valueAttr ? model.get(valueAttr) : model;
            const key = model.get(keyAttr);
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
        const result = {};
        if (!Array.isArray(models)) {
            return result;
        }
        for (const model of models) {
            result[model.get(keyAttr)] = valueAttr ? model.get(valueAttr) : model;
        }
        return result;
    }
};