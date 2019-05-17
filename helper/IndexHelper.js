/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class IndexHelper {

    static indexObjects (docs, keyProp, valueProp) {
        let map = {};
        if (!Array.isArray(docs)) {
            return map;
        }
        for (let doc of docs) {
            if (doc === null || doc === undefined) {
                continue;
            }
            let value = valueProp === undefined ? doc : doc[valueProp];
            let key = doc[keyProp];
            if (!Object.prototype.hasOwnProperty.call(map, key)) {
                map[key] = value;
            } else if (Array.isArray(map[key])) {
                map[key].push(value);
            } else {
                map[key] = [map[key], value];
            }
        }
        return map;
    }

    static indexUniqueKeyObjects (docs, keyProp, valueProp) {
        let map = {};
        if (!Array.isArray(docs)) {
            return map;
        }
        for (let doc of docs) {
            if (doc !== null && doc !== undefined) {
                map[doc[keyProp]] = valueProp === undefined
                    ? doc
                    : doc[valueProp];
            }
        }
        return map;
    }

    static indexModels (models, keyAttr, valueAttr) {
        let map = {};
        if (!Array.isArray(models)) {
            return map;
        }
        for (let model of models) {
            let value = valueAttr ? model.get(valueAttr) : model;
            let key = model.get(keyAttr);
            if (!Object.prototype.hasOwnProperty.call(map, key)) {
                map[key] = value;
            } else if (Array.isArray(map[key])) {
                map[key].push(value);
            } else {
                map[key] = [map[key], value];
            }
        }
        return map;
    }

    static indexUniqueKeyModels (models, keyAttr, valueAttr) {
        let map = {};
        if (!Array.isArray(models)) {
            return map;
        }
        for (let model of models) {
            map[model.get(keyAttr)] = valueAttr
                ? model.get(valueAttr)
                : model;
        }
        return map;
    }
};