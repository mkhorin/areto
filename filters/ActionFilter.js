'use strict';

let Base = require('../base/Behavior');

module.exports = class ActionFilter extends Base {

    constructor (config) {
        super(Object.assign({
            only: null,
            except: []
        }, config));
    }

    init () {
        super.init();
        this._events[Controller.EVENT_BEFORE_ACTION] = 'beforeFilter';
        this._events[Controller.EVENT_AFTER_ACTION] = 'afterFilter';
    }

    beforeFilter (event, cb) {
        if (this.isActive(event.action)) {
            this.beforeAction(event.action, err => {
                if (!err) {
                    // call afterFilter only if beforeFilter succeeds
                    let name = Controller.EVENT_AFTER_ACTION;
                    this._events[name] = 'afterFilter';
                    this.resolveEventHandler(name);
                    this.owner.on(name, this._events[name]);
                }
                cb(err);
            });
        } else cb();
    }

    afterFilter (event, cb) {
        this.afterAction(event.action, err => {
            this.owner.off(Controller.EVENT_AFTER_ACTION, this._events[Controller.EVENT_AFTER_ACTION]);
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
        let id = action.id;
        let uid = action.getUniqueId();
        let rid = action.getRelativeModuleId();
        if (this.owner instanceof Module) {
            id = action.getRelativeModuleId();
        }
        return !this.except.includes(id) && (!this.only || this.only.includes(id));
    }
};

let Module = require('../base/Module');
let Controller = require('../base/Controller');