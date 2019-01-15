/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class AssignHelper {

    static assignUndefined (target, ...args) {
        for (let source of args) {
            if (source && typeof source === 'object') {
                for (let key of Object.keys(source)) {
                    if (!Object.prototype.hasOwnProperty.call(target, key)) {
                        target[key] = source[key];
                    }
                }
            }
        }
        return target;
    }

    static deepAssign (target, ...args) {
        for (let arg of args) {
            this._assign(target, arg);
        }
        return target;
    }

    static deepAssignUndefined (target, ...args) {
        for (let arg of args) {
            this._assignUndefined(target, arg);
        }
        return target;
    }

    static _assign (to, from) {
        if (from && typeof from === 'object') {
            for (let prop of Object.keys(from)) {
                this._assignProp(to, from, prop);
            }
        }
        return to;
    }

    static _assignProp (to, from, prop) {
        if (Object.prototype.hasOwnProperty.call(from, prop)) {
            from = from[prop];
            if (from && typeof from === 'object' && !(from instanceof Array)) {
                if (Object.prototype.hasOwnProperty.call(to, prop) && to[prop] && typeof to[prop] === 'object') {
                    to[prop] = this._assign(to[prop], from);
                } else {
                    to[prop] = this._assign({}, from);
                }
            } else {
                to[prop] = from;
            }
        }
    }

    static _assignUndefined (to, from) {
        if (from && typeof from === 'object') {
            for (let prop of Object.keys(from)) {
                this._assignUndefinedProp(to, from, prop);
            }
        }
        return to;
    }

    static _assignUndefinedProp (to, from, prop) {
        if (Object.prototype.hasOwnProperty.call(from, prop)) {
            from = from[prop];
            if (Object.prototype.hasOwnProperty.call(to, prop)) {
                to = to[prop];
                if (from && typeof from === 'object' && to && typeof to === 'object') {
                    this._assignUndefined(to, from);
                }
            } else {
                to[prop] = from;
            }
        }
    }
};