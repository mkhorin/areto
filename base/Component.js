'use strict';

const Base = require('./Base');

module.exports = class Component extends Base {

    static getConstants () {
        return {
            // BEHAVIORS: { // auto-attached behaviors
                // behavior1: require('./UserBehavior1'),
                // behavior2: { Class: require('./UserBehavior2'), prop1: ..., prop2: ... }
                // behavior3: new BehaviorClass,
            // }
        };
    }

    init () {
        this.events = this.events ? ClassHelper.createInstance(this.events, {
            owner: this
        }) : new Events({
            owner: this
        });
        this.behaviors = this.behaviors ? ClassHelper.createInstance(this.behaviors, {
            owner: this
        }) : new Behaviors({
            owner: this,
            autoAttachedItems: this.BEHAVIORS
        });
    }

    on () {
        this.events.on.apply(this.events, arguments);
    }

    off () {
        this.events.off.apply(this.events, arguments);
    }

    trigger () {
        this.events.trigger.apply(this.events, arguments);
    }

    triggerCallback () {
        this.events.triggerCallback.apply(this.events, arguments);
    }

    getBehavior () {
        return this.behaviors.get.apply(this.behaviors, arguments);
    }

    attachBehavior () {
        return this.behaviors.attach.apply(this.behaviors, arguments);
    }

    detachBehavior () {
        return this.behaviors.detach.apply(this.behaviors, arguments);
    }

    getAllBehaviors () {
        return this.behaviors.getAll.apply(this.behaviors, arguments);
    }

    attachAllBehaviors () {
        this.behaviors.attachAll.apply(this.behaviors, arguments);
    }

    detachAllBehaviors () {
        this.behaviors.detachAll.apply(this.behaviors, arguments);
    }

    ensureBehaviors () {
        this.behaviors.ensure.call(this.behaviors);
    }

    log () {
        this.module.log.apply(this.module, arguments);
    }
};

const ClassHelper = require('../helpers/ClassHelper');
const Events = require('./Events');
const Behaviors = require('./Behaviors');