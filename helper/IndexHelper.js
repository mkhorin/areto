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
        if (Array.isArray(keyProp)) {
            return this.resolveObjectHierarchy(this.indexObjects, ...arguments);
        }
        for (const item of items) {
            if (item !== null && item !== undefined) {
                const value = valueProp !== undefined
                    ? item[valueProp]
                    : item;
                if (Array.isArray(item[keyProp])) {
                    for (const key of item[keyProp]) {
                        result[key] = value;
                    }
                } else if (Object.hasOwn(item, keyProp)) {
                    result[item[keyProp]] = value;
                }
            }
        }
        return result;
    }

    static indexObjectArrays (items, keyProp, valueProp) {
        const result = {};
        if (!Array.isArray(items)) {
            return result;
        }
        if (Array.isArray(keyProp)) {
            return this.resolveObjectHierarchy(this.indexObjectArrays, ...arguments);
        }
        for (const item of items) {
            if (item) {
                const value = valueProp !== undefined
                    ? item[valueProp]
                    : item;
                if (Array.isArray(item[keyProp])) {
                    for (const key of item[keyProp]) {
                        if (Array.isArray(result[key])) {
                            result[key].push(value);
                        } else {
                            result[key] = [value];
                        }
                    }
                } else if (!Object.hasOwn(item, keyProp)) {
                } else if (Array.isArray(result[item[keyProp]])) {
                    result[item[keyProp]].push(value);
                } else {
                    result[item[keyProp]] = [value];
                }
            }
        }
        return result;
    }

    static resolveObjectHierarchy (method, items, keyProps, valueProp) {
        if (!keyProps.length) {
            return {};
        }
        if (keyProps.length === 1) {
            return method.call(this, items, keyProps[0], valueProp);
        }
        const result = this.indexObjectArrays(items, keyProps[0]);
        const nextKeys = keyProps.slice(1);
        for (const key of Object.keys(result)) {
            result[key] = this.resolveObjectHierarchy(method, result[key], nextKeys, valueProp);
        }
        return result;
    }

    static indexModels (models, keyAttr, valueAttr) {
        const result = {};
        if (Array.isArray(models)) {
            for (const model of models) {
                result[model.get(keyAttr)] = valueAttr
                    ? model.get(valueAttr)
                    : model;
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
            const value = valueAttr
                ? model.get(valueAttr)
                : model;
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