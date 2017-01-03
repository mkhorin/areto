'use strict';

const fs = require('fs');
let path = require('path');
let ObjectID = require('mongodb').ObjectID;

module.exports = class MainHelper {

    static getRandom (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static parseJson (data) {
        try {
            return JSON.parse(data);
        } catch (err) {
            return null;
        }
    }

    static getScriptArgs () {
        return process.argv.slice(process.execArgv.length + 2);
    }

    static isEqualIds (id1, id2) {        
        return id1 instanceof ObjectID ? id1.equals(id2) : id1 === id2;
    }
    
    // DATE

    static isValidDate (date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        // stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript
        return Object.prototype.toString.call(date) !== '[object Date]' ? false : !isNaN(date.getTime());
    }

    static getValidDate (date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        return Object.prototype.toString.call(date) !== '[object Date]' ? null : isNaN(date.getTime()) ? null : date;
    }

    // ESCAPE

    static escapeRegExp (text) {
        return text.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    static escapeHtml (html) {
        return String(html).replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
            .replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/'/g, '&#39;').replace(/"/g, '&quot;');
    }

    // CLASS INSTANCE

    static createInstance (config, params) {
        if (typeof config === 'function') {
            return new config(params);
        }
        if (params) {
            Object.assign(config, params);
        }
        return config && config.Class ? new config.Class(config) : null;
    }
   
    // can get from Class['name'] and (new Class)['name']
    static defineClassProperty (Class, name, value, writable) {
        Object.defineProperty(Class, name, {value, writable});
        Object.defineProperty(Class.prototype, name, {value, writable});
    }

    // MODULE

    static getClosestModuleDir (file) {
        let dir = path.dirname(file);
        if (dir === file) {
            return null;
        } else if (this.isFileInDir('module.js', dir)) {
            return dir;
        } else {
            return this.getClosestModuleDir(dir);
        }
    }

    static isFileInDir (filename, dir) {
        try {
            let stat = fs.statSync(path.join(dir, filename));
            return stat && stat.isFile();
        } catch (err) {
            return false;
        }
    }

    // OBJECT

    static deepAssign (target, ...args) {
        for (let arg of args) {
            assignObject(target, arg);
        }
        return target;
    }
 
    static assignUndefined (target, ...args) {
        for (let from of args) 
            if (from && typeof from === 'object') 
                for (let prop in from) 
                    if (Object.prototype.hasOwnProperty.call(from, prop) && !(prop in target)) 
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
        for (let prop in object) {
            result.push(object[prop]);
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
            if (name in object) {
                delete object[name];      
            }
        }                     
    }
};

function assignObject (to, from) {
    if (from && typeof from === 'object') {
        for (let prop in from) {
            if (Object.prototype.hasOwnProperty.call(from, prop)) {
                assignObjectProperty(to, from, prop);
            }
        }
    }
    return to;
}

function assignObjectProperty (to, from, prop) {
    if (prop in from) {
        if (from[prop] !== null && typeof from[prop] === 'object') {
            if (prop in to && to[prop] !== null && typeof to[prop] === 'object') {
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
        for (let prop in from) {
            if (Object.prototype.hasOwnProperty.call(from, prop)) {
                assignObjectUndefinedProperty(to, from, prop);
            }
        }
    }
    return to;
}

function assignObjectUndefinedProperty (to, from, prop) {
    if (prop in from) {
        if (prop in to) {
            if (from[prop] !== null && typeof from[prop] === 'object'
                && to[prop] !== null && typeof to[prop] === 'object') {
                assignObjectUndefined(to[prop], from[prop])
            }
        } else to[prop] = from[prop];
    }
}