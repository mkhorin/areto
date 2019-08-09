/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Base');

module.exports = class Component extends Base {

    static getConstants () {
        return {
            // BEHAVIORS: { // auto-attached behaviors
                // behavior1: require('./UserBehavior1'),
                // behavior2: { Class: require('./UserBehavior2'), property1: ..., property2: ... }
                // behavior3: new BehaviorClass,
            // }
        };
    }

    constructor (config) {
        super({
            // depends: ['#start', '#end', 'componentId'] // order of component init
            // parent: [component from parent module]
            ...config
        });
        this.events = ClassHelper.spawn(this.eventManager || EventManager, {
            owner: this
        });
        this.behaviors = ClassHelper.spawn(this.behaviorManager || BehaviorManager, {
            owner: this,
            autoAttachedItems: this.BEHAVIORS
        });
    }

    on () {
        this.events.on(...arguments);
    }

    off () {
        this.events.off(...arguments);
    }

    trigger () {
        return this.events.trigger(...arguments);
    }

    getBehavior (name) {
        return this.behaviors.get(name);
    }

    attachBehavior () {
        return this.behaviors.attach(...arguments);
    }

    attachBehaviorOnce () {
        return this.behaviors.attachOnce(...arguments);
    }

    detachBehavior (name) {
        return this.behaviors.detach(name);
    }

    getAllBehaviors () {
        return this.behaviors.getAll();
    }

    attachAllBehaviors (data) {
        this.behaviors.attachAll(data);
    }

    detachAllBehaviors () {
        this.behaviors.detachAll();
    }

    ensureBehaviors () {
        this.behaviors.ensure();
    }

    translate () {
        return this.module.translate(...arguments);
    }

    log () {
        CommonHelper.log(this.module, this.constructor.name, ...arguments);
    }
};

const ClassHelper = require('../helper/ClassHelper');
const CommonHelper = require('../helper/CommonHelper');
const EventManager = require('./EventManager');
const BehaviorManager = require('./BehaviorManager');