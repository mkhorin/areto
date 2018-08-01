'use strict';

const Base = require('./Base');

module.exports = class Behavior extends Base {

    init () {
        this._handlers = {};
    }

    hasHandler (eventName) {
        return Object.prototype.hasOwnProperty.call(this._handlers, eventName);
    }

    assign (eventName, method) {
        this._handlers[eventName] = method.bind(this);
    }

    attach (owner) {
        this.owner = owner;
        for (let name of Object.keys(this._handlers)) {
            this.owner.on(name, this._handlers[name]);
        }
    }

    detach () {
        if (this.owner) {
            for (let name of Object.keys(this._handlers)) {
                this.owner.off(name, this._handlers[name]);
            }
            this.owner = null;
        }
    }

    attachHandler (eventName) {
        if (!this.owner && this.hasHandler(eventName)) {
            this.owner.on(eventName, this._handlers[eventName]);
        }
    }

    detachHandler (eventName) {
        if (this.owner && this.hasHandler(eventName)) {
            this.owner.off(eventName, this._handlers[eventName]);
        }
    }

    log (type, message, data) {
        CommonHelper.log(type, message, data, this.constructor.name, this.owner);
    }
};

const CommonHelper = require('../helper/CommonHelper');

