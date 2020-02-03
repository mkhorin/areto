/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class AssignHelper {

    static assignUndefined (target, ...sources) {
        for (const source of sources) {
            if (source && typeof source === 'object') {
                for (const key of Object.keys(source)) {
                    if (!Object.prototype.hasOwnProperty.call(target, key)) {
                        target[key] = source[key];
                    }
                }
            }
        }
        return target;
    }

    static deepAssign (target, ...sources) {
        for (const source of sources) {
            this._assign(target, source);
        }
        return target;
    }

    static deepAssignUndefined (target, ...sources) {
        for (const source of sources) {
            this._assignUndefined(target, source);
        }
        return target;
    }

    // INTERNAL

    static _assign (to, from) {
        if (from && typeof from === 'object') {
            for (const key of Object.keys(from)) {
                this._assignProperty(to, from, key);
            }
        }
        return to;
    }

    static _assignProperty (to, from, key) {
        if (!Object.prototype.hasOwnProperty.call(from, key)) {
            return;
        }
        from = from[key];
        if (from && typeof from === 'object' && !Array.isArray(from)) {
            if (Object.prototype.hasOwnProperty.call(to, key) && to[key] && typeof to[key] === 'object') {
                to[key] = this._assign(to[key], from);
            } else {
                to[key] = this._assign({}, from);
            }
        } else {
            to[key] = from;
        }
    }

    static _assignUndefined (to, from) {
        if (from && typeof from === 'object') {
            for (const key of Object.keys(from)) {
                this._assignUndefinedProperty(to, from, key);
            }
        }
        return to;
    }

    static _assignUndefinedProperty (to, from, key) {
        if (!Object.prototype.hasOwnProperty.call(from, key)) {
            return;
        }
        from = from[key];
        if (!Object.prototype.hasOwnProperty.call(to, key)) {
            return to[key] = from;
        }
        to = to[key];
        if (from && typeof from === 'object' && to && typeof to === 'object') {
            this._assignUndefined(to, from);
        }
    }
};