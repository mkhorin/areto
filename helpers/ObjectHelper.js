'use strict';

module.exports = class ObjectHelper {

    static deepAssign (target, ...args) {
        for (let arg of args) {
            assignObject(target, arg);
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
            assignObjectUndefined(target, arg);
        }
        return target;
    }

    static mapObject (object, handler, depth) {
        for (let prop in object) {
            if (depth && object[prop] instanceof Object) {
                this.mapObject(object[prop], handler, depth);
            } else {
                handler(prop, object);
            }
        }
    }

    static objectToValueArray (object) {
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

    static deleteObjectProperties (object, names) {
        for (let name of names) {
            if (Object.prototype.hasOwnProperty.call(object, name)) {
                delete object[name];      
            }
        }                     
    }
};

function assignObject (to, from) {
    if (from && typeof from === 'object') {
        for (let prop of Object.keys(from)) {
            assignObjectProperty(to, from, prop);
        }
    }
    return to;
}

function assignObjectProperty (to, from, prop) {
    if (Object.prototype.hasOwnProperty.call(from, prop)) {
        if (from[prop] !== null && typeof from[prop] === 'object') {
            if (Object.prototype.hasOwnProperty.call(to, prop) && to[prop] !== null && typeof to[prop] === 'object') {
                to[prop] = assignObject(to[prop], from[prop]);
            } else {
                to[prop] = from[prop];
            }
        } else {
            to[prop] = from[prop];
        }
    }
}

function assignObjectUndefined (to, from) {
    if (from && typeof from === 'object') {
        for (let prop of Object.keys(from)) {
            assignObjectUndefinedProperty(to, from, prop);
        }
    }
    return to;
}

function assignObjectUndefinedProperty (to, from, prop) {
    if (Object.prototype.hasOwnProperty.call(from, prop)) {
        if (Object.prototype.hasOwnProperty.call(to, prop)) {
            if (from[prop] !== null && typeof from[prop] === 'object'
                && to[prop] !== null && typeof to[prop] === 'object') {
                assignObjectUndefined(to[prop], from[prop])
            }
        } else {
            to[prop] = from[prop];
        }
    }
}