'use strict';

module.exports = class ArrayHelper {

    static diff (target, excluded) {
        return target.filter(item => excluded.indexOf(item) < 0);
    }

    static flip (values) {
        let object = {};
        for (let value of values) {
            object[value] = null;
        }
        return object;
    }

    static getRandom (values) {
        return values.length ? values[Math.floor(Math.random() * values.length)] : null;
    }

    static shuffle (values) {
        let i = values.length;
        while (i) {
            let j = Math.floor((i--) * Math.random());
            let t = values[i];
            values[i] = values[j];
            values[j] = t;
        }
        return values;
    }

    static intersect (source, target) {
        let result = [];
        for (let item of source) {
            target.includes(item) && result.push(item);
        }
        return result;
    }

    static unique (values) {
        return values.filter((value, index)=> values.indexOf(value) === index);
    }

    static getObjectKeyValue (values, searchKey, value, targetKey) {
        for (let item of values) {
            if (item[searchKey] === value) {
                return item[targetKey];
            }
        }
        return null;
    }
};