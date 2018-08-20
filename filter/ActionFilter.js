'use strict';

const Base = require('../base/Behavior');

module.exports = class ActionFilter extends Base {

    constructor (config) {
        super(Object.assign({
            only: null,
            except: []
        }, config));
        
        this.assign(Controller.EVENT_BEFORE_ACTION, this.beforeFilter);
    }

    beforeFilter (cb, event) {
        if (!this.isActive(event.action)) {
            return cb();
        }
        this.beforeAction(event.action, err => {
            if (err) {
                return cb(err);
            }
            // use afterFilter on beforeFilter success only
            this.assign(Controller.EVENT_AFTER_ACTION, this.afterFilter);
            this.attachHandler(Controller.EVENT_AFTER_ACTION);
            cb();
        });
    }

    afterFilter (cb, event) {
        this.afterAction(event.action, err => {
            this.detachHandler(Controller.EVENT_AFTER_ACTION);
            cb(err);
        });        
    }

    beforeAction (action, cb) {
        cb();
    }

    afterAction (action, cb) {
        cb();
    }

    isActive (action) {
        let rid = action.getRelativeModuleName();
        let uid = action.getUniqueName();
        let id = this.owner instanceof Module ? rid : action.name;
        return !this.except.includes(id) && (!this.only || this.only.includes(id));
    }
};

const Module = require('../base/Module');
const Controller = require('../base/Controller');