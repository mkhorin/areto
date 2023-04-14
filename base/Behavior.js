/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Base');

module.exports = class Behavior extends Base {

    _handlers = {};

    attach (owner) {
        this.owner = owner;
        this.module = owner.module;
        for (const name of Object.keys(this._handlers)) {
            this.owner.on(name, this._handlers[name]);
        }
    }

    detach () {
        for (const name of Object.keys(this._handlers)) {
            this.owner?.off(name, this._handlers[name]);
        }
        this.owner = null;
    }

    hasHandler (eventName) {
        return Object.hasOwn(this._handlers, eventName);
    }

    setHandler (eventName, method) {
        this._handlers[eventName] = method.bind(this);
    }

    attachHandler (eventName) {
        if (this.hasHandler(eventName)) {
            this.owner?.on(eventName, this._handlers[eventName]);
        }
    }

    detachHandler (eventName) {
        if (this.hasHandler(eventName)) {
            this.owner?.off(eventName, this._handlers[eventName]);
        }
    }

    log () {
        CommonHelper.log(this.owner, this.constructor.name, ...arguments);
    }
};

const CommonHelper = require('../helper/CommonHelper');