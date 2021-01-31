/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Base');

module.exports = class Event extends Base {

    // CLASS LEVEL EVENTS

    static once (target, name, handler, data, prepend) {
        this.on(target, name, handler, data, prepend, 1);
    }

    static on (target, name, handler, data, prepend, counter) {
        const id = target.CLASS_FILE;
        if (!id) {
            throw new Error('Invalid target class');
        }
        if (typeof handler !== 'function') {
            throw new Error('Invalid event handler');
        }
        if (!Object.prototype.hasOwnProperty.call(this._eventMap, name)) {
            this._eventMap[name] = {};
        }
        const targetMap = this._eventMap[name];
        if (!Array.isArray(targetMap[id])) {
            targetMap[id] = [];
        }
        handler = [handler, data, counter, targetMap[id]];
        prepend ? targetMap[id].unshift(handler)
                : targetMap[id].push(handler);
    }

    static off (target, name, handler) {
        if (target === undefined) {
            this._eventMap = {};
            return true;
        }
        const id = target.CLASS_FILE;
        if (!id) {
            throw new Error('Invalid target class');
        }
        if (!name) {
            return this.detachByTarget(id);
        }
        const targetMap = this._eventMap[name];
        if (!targetMap || !Array.isArray(targetMap[id])) {
            return false;
        }
        if (handler) {
            return this.detachByHandler(handler, targetMap[id]);
        }
        delete targetMap[id];
        return true;
    }

    static detachByTarget (target) {
        for (const targetMap of Object.values(this._eventMap)) {
            for (const key of Object.keys(targetMap)) {
                if (key === target) {
                    delete targetMap[key];
                }
            }
        }
        return true;
    }

    static detachByHandler (handler, items) {
        let detached = false;
        for (let i = items.length - 1; i >= 0; --i) {
            if (items[i][0] === handler) {
                items.splice(i, 1);
                detached = true;
            }
        }
        return detached;
    }

    static trigger (sender, name, event, items = []) {
        if (Object.prototype.hasOwnProperty.call(this._eventMap, name)) {
            const Class = typeof sender !== 'function' ? sender.constructor : sender;
            if (!Class.CLASS_FILE) {
                throw new Error('Invalid event sender');
            }
            this.prependHandlers(Class, this._eventMap[name], items);
        }
        if (items.length) {
            return this.executeHandlers(items, this.create(event, sender, name));
        }
    }

    static prependHandlers (Class, targetMap, items) {
        const parent = Object.getPrototypeOf(Class);
        if (parent && targetMap[parent.CLASS_FILE]) {
            this.prependHandlers(parent, targetMap, items);
        }
        if (Array.isArray(targetMap[Class.CLASS_FILE])) {
            items.unshift(...targetMap[Class.CLASS_FILE]);
        }
    }

    static async executeHandlers (items, event) {
        for (const item of items) {
            if (event.handled) {
                break;
            }
            await item[0].call(this, event, item[1]);
            if (typeof item[2] === 'number' && --item[2] < 1) {
                ArrayHelper.remove(item, item[3]);
            }
        }
    }

    static create (event, sender, name) {
        event = event || new this;
        event.sender = sender;
        event.handled = false;
        event.name = name;
        return event;
    }

    static hasHandlerByName (name) {
        return Object.prototype.hasOwnProperty.call(this._eventMap, name);
    }

    static hasHandlerByTarget (target, name) {
        if (!this.hasHandlerByName(name)) {
            return false;
        }
        if (typeof target !== 'function') {
            target = target.constructor;
        }
        const targetMap = this._eventMap[name];
        // check target listeners and its ancestors
        let id = target.CLASS_FILE;
        while (id) {
            if (targetMap[id]?.length) {
                return true;
            }
            target = Object.getPrototypeOf(target); // get parent class
            id = target?.CLASS_FILE;
        }
        return false;
    }

    constructor (config) {
        super({
            name: null,
            sender: null,
            handled: false,
            ...config
        });
    }
};
module.exports._eventMap = {};

const ArrayHelper = require('../helper/ArrayHelper');