/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Base');

module.exports = class EventManager extends Base {

    constructor (config) {
        super(config);
        this._events = {};
    }

    // OBJECT-LEVEL EVENTS
    /**
     * @param name
     * @param handler
     * @param data - comes only with this handler
     * @param prepend
     */
    on (name, handler, data, prepend) {
        if (!name) {
            throw new Error(this.wrapClassMessage('Invalid event name'));
        }   
        if (typeof handler !== 'function') {
            throw new Error(this.wrapClassMessage('Invalid event handler'));
        }
        this.owner.ensureBehaviors();
        if (!this._events[name]) {
            this._events[name] = [];
        }
        // reverse order, see trigger()
        prepend ? this._events[name].push([handler, data]) 
                : this._events[name].unshift([handler, data]);
    }

    off (name, handler) {
        this.owner.ensureBehaviors();
        if (!Array.isArray(this._events[name])) {
            return false;
        }
        if (!handler) {
            delete this._events[name];
            return true;
        }
        let removed = false;
        for (let i = this._events[name].length - 1; i >= 0; --i) {
            if (this._events[name][i][0] === handler) {
                this._events[name].splice(i, 1);
                removed = true;
            }
        }
        return removed;
    }

    trigger (name, event) {
        this.owner.ensureBehaviors();
        if (!Array.isArray(this._events[name])) {
            return Event.trigger(this.owner, name, event); // invoke class-level handlers
        }
        event = Event.create(event, this.owner, name);
        let tasks = this._events[name].map(handler => {
            return handler[0].bind(this, event, handler[1]);
        });
        return Event.trigger(this.owner, name, event, tasks);
    }

    hasHandler (name) {
        this.owner.ensureBehaviors();
        return Array.isArray(this._events[name]) || Event.hasHandler(this.owner, name);
    }
};

const Event = require('./Event');