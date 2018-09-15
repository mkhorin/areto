/**
 * @copyright Copyright (c) 2018 Maxim Khorin (maksimovichu@gmail.com)
 */
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

    constructor (config) {
        super(config);
        this.events = ClassHelper.createInstance(this.eventManager || EventManager, {
            owner: this
        });
        this.behaviors = ClassHelper.createInstance(this.behaviorManager || BehaviorManager, {
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

    triggerWait () {
        return this.events.triggerWait.apply(this.events, arguments);
    }

    getBehavior () {
        return this.behaviors.get.apply(this.behaviors, arguments);
    }

    attachBehavior () {
        return this.behaviors.attach.apply(this.behaviors, arguments);
    }

    attachBehaviorOnce () {
        return this.behaviors.attachOnce.apply(this.behaviors, arguments);
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

    log (type, message, data) {
        CommonHelper.log(type, message, data, this.constructor.name, this.module);
    }
};

const ClassHelper = require('../helper/ClassHelper');
const CommonHelper = require('../helper/CommonHelper');
const EventManager = require('./EventManager');
const BehaviorManager = require('./BehaviorManager');