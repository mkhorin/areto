/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class IndexHelper {

    static indexObjects (items, keyProp, valueProp) {
        const result = {};
        if (!Array.isArray(items)) {
            return result;
        }
        for (const item of items) {
            if (item !== null && item !== undefined) {
                result[item[keyProp]] = valueProp === undefined ? item : item[valueProp];
            }
        }
        return result;
    }

    static indexObjectArrays (docs, keyProp, valueProp) {
        const result = {};
        if (!Array.isArray(docs)) {
            return result;
        }
        for (const doc of docs) {
            if (doc) {
                const value = valueProp === undefined ? doc : doc[valueProp];
                if (Array.isArray(result[doc[keyProp]])) {
                    result[doc[keyProp]].push(value);
                } else {
                    result[doc[keyProp]] = [value];
                }
            }
        }
        return result;
    }

    static indexModels (models, keyAttr, valueAttr) {
        const result = {};
        if (Array.isArray(models)) {
            for (const model of models) {
                result[model.get(keyAttr)] = valueAttr ? model.get(valueAttr) : model;
            }
        }
        return result;
    }

    static indexModelArrays (models, keyAttr, valueAttr) {
        const result = {};
        if (!Array.isArray(models)) {
            return result;
        }
        for (const model of models) {
            const value = valueAttr ? model.get(valueAttr) : model;
            const key = model.get(keyAttr);
            if (Array.isArray(result[key])) {
                result[key].push(value);
            } else {
                result[key] = [value];
            }
        }
        return result;
    }
};