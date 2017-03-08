'use strict';

module.exports = class ObjectHelper {

    static deepAssign (target, ...args) {
        for (let arg of args) {
            this.assignInternal(target, arg);
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
            this.assignUndefinedInternal(target, arg);
        }
        return target;
    }

    static map (object, handler, depth) {
        for (let prop in object) {
            if (depth && object[prop] instanceof Object) {
                this.map(object[prop], handler, depth);
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

    // INTERNAL

    static assignInternal (to, from) {
        if (from && typeof from === 'object') {
            for (let prop of Object.keys(from)) {
                this.assignPropertyInternal(to, from, prop);
            }
        }
        return to;
    }

    static assignPropertyInternal (to, from, prop) {
        if (Object.prototype.hasOwnProperty.call(from, prop)) {
            if (from[prop] !== null && typeof from[prop] === 'object') {
                if (Object.prototype.hasOwnProperty.call(to, prop) && to[prop] !== null && typeof to[prop] === 'object') {
                    to[prop] = this.assignInternal(to[prop], from[prop]);
                } else {
                    to[prop] = from[prop];
                }
            } else {
                to[prop] = from[prop];
            }
        }
    }

    static assignUndefinedInternal (to, from) {
        if (from && typeof from === 'object') {
            for (let prop of Object.keys(from)) {
                this.assignUndefinedPropertyInternal(to, from, prop);
            }
        }
        return to;
    }

    static assignUndefinedPropertyInternal (to, from, prop) {
        if (Object.prototype.hasOwnProperty.call(from, prop)) {
            if (Object.prototype.hasOwnProperty.call(to, prop)) {
                if (from[prop] !== null && typeof from[prop] === 'object'
                    && to[prop] !== null && typeof to[prop] === 'object') {
                    this.assignUndefinedInternal(to[prop], from[prop])
                }
            } else {
                to[prop] = from[prop];
            }
        }
    }
};