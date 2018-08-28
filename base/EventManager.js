'use strict';

const Base = require('./Base');

module.exports = class EventManager extends Base {

    constructor (config) {
        super(config);
        this._events = {};
    }

    // OBJECT-LEVEL EVENTS

    hasHandler (name) {
        this.owner.ensureBehaviors();
        return this._events[name] instanceof Array || Event.hasHandler(this.owner, name);
    }

    /**
     * @data - comes only with this handler
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
        if (!(this._events[name] instanceof Array)) {
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
        if (this._events[name] instanceof Array) {
            event = Event.create(event, this.owner, name);
            // trigger can be deleted inside the handler, array will change _events[name]
            for (let i = this._events[name].length - 1; i >= 0; --i) {
                this._events[name][i][0](event, this._events[name][i][1]); // handler(event, data)
                if (event.handled) {
                    return;
                }
            }
        }        
        Event.trigger(this.owner, name, event); // invoke class-level handlers
    }

    triggerWait (name, event) {
        this.owner.ensureBehaviors();
        let tasks = [];
        if (this._events[name] instanceof Array) {
            event = Event.create(event, this.owner, name);
            this._events[name].forEach(handler => {
                tasks.push(()=> handler[0](event, handler[1]));
            });
        }
        return Event.triggerWait(this.owner, name, event, tasks);
    }
};

const Event = require('./Event');