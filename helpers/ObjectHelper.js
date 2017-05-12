'use strict';

module.exports = class ObjectHelper {

    static deepAssign (target, ...args) {
        for (let arg of args) {
            this._assign(target, arg);
        }
        return target;
    }
 
    static assignUndefined (target, ...args) {
        for (let from of args) 
            if (from && typeof from === 'object') 
                for (let prop of Object.keys(from))
                    if (!Object.prototype.hasOwnProperty.call(target, prop))
                        target[prop] = from[prop];
        return target;
    }

    static deepAssignUndefined (target, ...args) {
        for (let arg of args) {
            this._assignUndefined(target, arg);
        }
        return target;
    }

    static map (object, handler, depth = 10) {
        for (let prop of Object.keys(object)) {
            if (depth > 0 && object[prop] instanceof Object) {
                this.map(object[prop], handler, depth - 1);
            } else {
                handler(prop, object);
            }
        }
    }

    static toValueArray (object) {
        let result = [];
        if (object) {
            for (let prop of Object.keys(object)) {
                result.push(object[prop]);
            }
        }
        return result;
    }

    static getAllPropertyNames (object) {
        if (!object) {
            return [];
        }
        let props = Object.getOwnPropertyNames(object);
        let proto = Object.getPrototypeOf(object);
        for (let target of this.getAllPropertyNames(proto)) {
            if (props.includes(target) === false) {
                props.push(target);
            }
        }
        return props;
    }

    static getAllFunctionNames (object) {
        return this.getAllPropertyNames(object).filter(item => typeof object[item] === 'function');
    }

    static deleteProperties (object, names) {
        for (let name of names) {
            if (Object.prototype.hasOwnProperty.call(object, name)) {
                delete object[name];      
            }
        }                     
    }

    static deleteEmptyProperties (object) {
        for (let name of Object.keys(object)) {
            if (object[name] === null || object[name] === '') {
                delete object[name];
            }
        }
    }

    static filterPropertiesByIn (object, keys) {
        for (let name of Object.keys(object)) {
            if (!keys.includes(name)) {
                delete object[name];
            }
        }
    }

    static filterPropertiesByNotIn (object, keys) {
        for (let name of Object.keys(object)) {
            if (keys.includes(name)) {
                delete object[name];
            }
        }
    }

    static getNestedValue(object, key, defaults) {
        if (!(object instanceof Object) || typeof key !== 'string') {
            return defaults;
        }
        if (Object.prototype.hasOwnProperty.call(object, key)) {
            return object[key];
        }
        let index = key.indexOf('.');
        if (index > 0) {
            let targetKey = key.substring(0, index);
            if (Object.prototype.hasOwnProperty.call(object, targetKey)) {
                key = key.substring(index + 1);
                object = object[targetKey];
                if (object instanceof Array) {
                    return object.map(item => this.getNestedValue(item, key, defaults));
                }
                if (object) {
                    return this.getNestedValue(object, key, defaults);
                }
            }
        }
        return defaults;
    }

    // INTERNAL

    static _assign (to, from) {
        if (from && typeof from === 'object') {
            for (let prop of Object.keys(from)) {
                this._assignProperty(to, from, prop);
            }
        }
        return to;
    }

    static _assignProperty (to, from, prop) {
        if (Object.prototype.hasOwnProperty.call(from, prop)) {
            if (from[prop] !== null && typeof from[prop] === 'object') {
                if (Object.prototype.hasOwnProperty.call(to, prop) && to[prop] !== null && typeof to[prop] === 'object') {
                    to[prop] = this._assign(to[prop], from[prop]);
                } else {
                    to[prop] = from[prop];
                }
            } else {
                to[prop] = from[prop];
            }
        }
    }

    static _assignUndefined (to, from) {
        if (from && typeof from === 'object') {
            for (let prop of Object.keys(from)) {
                this._assignUndefinedProperty(to, from, prop);
            }
        }
        return to;
    }

    static _assignUndefinedProperty (to, from, prop) {
        if (Object.prototype.hasOwnProperty.call(from, prop)) {
            if (Object.prototype.hasOwnProperty.call(to, prop)) {
                if (from[prop] !== null && typeof from[prop] === 'object'
                    && to[prop] !== null && typeof to[prop] === 'object') {
                    this._assignUndefined(to[prop], from[prop])
                }
            } else {
                to[prop] = from[prop];
            }
        }
    }
};