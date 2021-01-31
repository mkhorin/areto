/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Base');

module.exports = class BehaviorManager extends Base {

    get (name) {
        this.ensure();
        return this._behaviorMap[name] instanceof Behavior ? this._behaviorMap[name] : null;
    }

    attach (name, data) {
        this.ensure();
        return this.attachInternal(name, data);
    }

    attachOnce (name, data) {
        return this.get(name) || this.attachInternal(name, data);
    }

    detach (name) {
        const behavior = this.get(name);
        if (behavior) {
            delete this._behaviorMap[name];
            behavior.detach();
        }
        return behavior;        
    }

    getAll () {
        this.ensure();
        return this._behaviorMap;
    }

    attachAll (data) {
        this.ensure();
        for (const name of Object.keys(data)) {
            this.attachInternal(name, data[name]);
        }
    }

    detachAll () {
        this.ensure();
        for (const name of Object.keys(this._behaviorMap)) {
            this.detach(name);
        }
    }

    ensure () {
        if (this._behaviorMap) {
            return;
        }
        this._behaviorMap = {};
        if (this.autoAttachedMap) {
            for (const name of Object.keys(this.autoAttachedMap)) {
                this.attach(name, this.autoAttachedMap[name]);
            }
        }
    }

    attachInternal (name, behavior) {
        if (!behavior) {
            throw new Error(`Attach undefined behavior: ${name}`);
        } 
        if (behavior.prototype instanceof Behavior) {
            behavior = new behavior({name});
        } else if (behavior.Class?.prototype instanceof Behavior) {
            behavior.name = behavior.name || name;
            behavior = new behavior.Class(behavior);
        } else if (!(behavior instanceof Behavior)) {
            throw new Error(`Attach invalid behavior: ${name}`);
        }
        if (this._behaviorMap[name] instanceof Behavior) {
            this._behaviorMap[name].detach();
        }
        behavior.attach(this.owner);
        this._behaviorMap[name] = behavior;
        return behavior;
    }
};

const Behavior = require('./Behavior');