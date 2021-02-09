/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class AssignHelper {

    static assignUndefined (target, ...sources) {
        for (const source of sources) {
            if (this.isExtendable(source)) {
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

    static isExtendable (data) {
        return typeof data === 'object'
            && data !== null
            && !(data instanceof Array)
            && !(data instanceof Date)
            && !(data instanceof RegExp);
    }

    // INTERNAL

    static _assign (to, from) {
        if (this.isExtendable(from)) {
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
        if (this.isExtendable(from)) {
            to[key] = Object.prototype.hasOwnProperty.call(to, key) && this.isExtendable(to[key])
                ? this._assign(to[key], from)
                : this._assign({}, from);
        } else {
            to[key] = from;
        }
    }

    static _assignUndefined (to, from) {
        if (this.isExtendable(from)) {
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
        if (this.isExtendable(from) && this.isExtendable(to)) {
            this._assignUndefined(to, from);
        }
    }
};