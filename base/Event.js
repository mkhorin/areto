/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Base');

module.exports = class Event extends Base {

    constructor (config) {
        super({
            name: null,
            sender: null,
            handled: false,
            ...config
        });
    }

    // CLASS-LEVEL EVENTS

    static on (target, name, handler, data, prepend) {
        const id = target.CLASS_FILE;
        if (!id) {
            throw new Error(this.wrapClassMessage('Invalid event target'));
        }
        if (typeof name !== 'string') {
            throw new Error(this.wrapClassMessage('Invalid event name'));
        }
        if (typeof handler !== 'function') {
            throw new Error(this.wrapClassMessage('Invalid event handler'));
        }
        let event = this._events[name];
        if (!event) {
            this._events[name] = event = {};
        }
        event[id] = event[id] || [];
        prepend ? event[id].push([handler, data]) 
                : event[id].unshift([handler, data]);
    }

    static off (target, name, handler) {
        const id = target.CLASS_FILE;
        const event = this._events[name];
        if (!id || !event || !event[id]) {
            return false;
        }
        if (!handler) {
            delete event[id];
            return true;
        }
        let removed = false;
        for (let i = event[id].length - 1; i >= 0; --i) {
            if (event[id][i][0] === handler) {
                event[id].splice(i, 1);
                removed = true;
            }
        }
        return removed;
    }

    static async trigger (sender, name, event, tasks = []) {
        if (this._events[name]) {
            event = this.create(event, sender, name);
            if (typeof sender !== 'function') {
                sender = sender.constructor;
            }
            if (!sender.CLASS_FILE) {
                throw new Error(this.wrapClassMessage('Invalid event sender'));
            }
            this.resolveTasks(sender, name, event, tasks);
        }
        for (let task of tasks.reverse()) {
            if (!event.handled) {
                await task();
            }
        }
    }

    static hasHandler (sender, name) {
        if (!Array.isArray(this._events[name])) {
            return false;
        }
        if (typeof sender !== 'function') {
            sender = sender.constructor;
        }
        // check listeners of the sender class and ancestors
        let id = sender.CLASS_FILE;
        while (id) {
            if (this._events[name][id] && this._events[name][id].length) {
                return true;
            }
            sender = Object.getPrototypeOf(sender);
            id = sender ? sender.CLASS_FILE : null;
        }
        return false;
    }

    static create (event, sender, name) {
        event = event || new this;
        event.sender = event.sender || sender;
        event.handled = false;
        event.name = name;
        return event;
    }

    static resolveTasks (sender, name, event, tasks) {
        let id = sender.CLASS_FILE;
        while (id) {
            if (Array.isArray(this._events[name][id])) {
                for (let handler of this._events[name][id]) {
                    tasks.push(handler[0].bind(this, event, handler[1]));
                }
            }
            sender = Object.getPrototypeOf(sender); // get parent class
            id = sender ? sender.CLASS_FILE : null;
        }
    }
};
module.exports._events = {};