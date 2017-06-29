'use strict';

const Base = require('./Base');

module.exports = class Behavior extends Base {

    /**
     * init ()
     * event title will be replaced with handler
     * Model::EVENT_BEFORE_VALIDATE: 'myBeforeValidate',
     * Model::EVENT_AFTER_VALIDATE: 'myAfterValidate',
     * Model::EVENT_BEFORE_VALIDATE: cb => { cb(); },
     */

    constructor (config) {
        super(Object.assign({
            owner: null 
        }, config));
    }
    
    init () {
        super.init();
        this._events = {};
    }

    attach (owner) {
        this.owner = owner;
        for (let name of Object.keys(this._events)) {
            this.resolveEventHandler(name);
            this.owner.on(name, this._events[name]);
        }
    }

    // replace string to this method handler
    resolveEventHandler (name) {
        if (typeof this._events[name] === 'string') {
            let handler = this[this._events[name]];
            if (typeof handler === 'function') {                
                this._events[name] = handler.bind(this); // handler(event, cb, data)
            }
        }
    }

    detach () {
        if (this.owner) {
            for (let name of Object.keys(this._events)) {
                this.owner.off(name, this._events[name]);
            }
            this.owner = null;
        }
    }
};