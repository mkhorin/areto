/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Base');

module.exports = class EventManager extends Base {

    _eventMap = {};

    // INSTANCE LEVEL EVENTS

    once (name, handler, data, prepend) {
        this.on(name, handler, data, prepend, 1);
    }

    on (name, handler, data, prepend, counter) {
        if (!name) {
            throw new Error(this.wrapClassMessage('Invalid event name'));
        }
        if (typeof handler !== 'function') {
            throw new Error(this.wrapClassMessage('Invalid event handler'));
        }
        if (!Array.isArray(this._eventMap[name])) {
            this._eventMap[name] = [];
        }
        handler = [handler, data, counter, this._eventMap[name]];
        prepend ? this._eventMap[name].unshift(handler)
                : this._eventMap[name].push(handler);
    }

    off (name, handler) {
        if (!name) {
            this._eventMap = {};
            return true;
        }
        if (!Array.isArray(this._eventMap[name])) {
            return false;
        }
        if (handler) {
            return Event.detachByHandler(handler, this._eventMap[name]);
        }
        delete this._eventMap[name];
        return true;
    }

    trigger (name, event) {
        // prevent runtime handler list changes
        const items = Array.isArray(this._eventMap[name]) ? this._eventMap[name].slice() : [];
        return Event.trigger(this.owner, name, event, items);
    }
};

const Event = require('./Event');