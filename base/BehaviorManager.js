/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Base');

module.exports = class BehaviorManager extends Base {

    get (name) {
        this.ensure();
        return this._behaviors[name] instanceof Behavior ? this._behaviors[name] : null;
    }

    attach (name, data) {
        this.ensure();
        return this.attachInternal(name, data);
    }

    attachOnce (name, data) {
        return this.get(name) || this.attachInternal(name, data);
    }

    detach (name) {
        let behavior = this.get(name);
        if (behavior) {
            delete this._behaviors[name];
            behavior.detach();
        }
        return behavior;        
    }

    getAll () {
        this.ensure();
        return this._behaviors;
    }

    attachAll (data) {
        this.ensure();
        for (let name of Object.keys(data)) {
            this.attachInternal(name, data[name]);
        }
    }

    detachAll () {
        this.ensure();
        for (let name of Object.keys(this._behaviors)) {
            this.detach(name);
        }
    }

    ensure () {
        if (!this._behaviors) {
            this._behaviors = {};
            if (this.autoAttachedItems) {
                for (let name of Object.keys(this.autoAttachedItems)) {
                    this.attach(name, this.autoAttachedItems[name]);
                }
            }
        }
    }

    attachInternal (name, behavior) {
        if (!behavior) {
            throw new Error(this.wrapClassMessage(`Attach undefined behavior: ${name}`));
        } 
        if (behavior.prototype instanceof Behavior) {
            behavior = new behavior({name});
        } else if (behavior.Class && behavior.Class.prototype instanceof Behavior) {
            behavior.name = behavior.name || name;
            behavior = new behavior.Class(behavior);
        } else if (!(behavior instanceof Behavior)) {
            throw new Error(this.wrapClassMessage(`Attach invalid behavior: ${name}`));
        }
        if (this._behaviors[name] instanceof Behavior) {
            this._behaviors[name].detach();
        }
        behavior.attach(this.owner);
        this._behaviors[name] = behavior;
        return behavior;
    }
};

const Behavior = require('./Behavior');