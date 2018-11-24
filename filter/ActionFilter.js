/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Behavior');

module.exports = class ActionFilter extends Base {

    constructor (config) {
        super({
            only: null,
            except: [],
            ...config
        });
        this.assign(Controller.EVENT_BEFORE_ACTION, this.beforeFilter);
    }

    async beforeFilter (event) {
        if (!this.isActive(event.action)) {
            return false;
        }
        await this.beforeAction(event.action);
        // use afterFilter on beforeFilter success only
        this.assign(Controller.EVENT_AFTER_ACTION, this.afterFilter);
        this.attachHandler(Controller.EVENT_AFTER_ACTION);
    }

    async afterFilter (event) {
        await this.afterAction(event.action);
        this.detachHandler(Controller.EVENT_AFTER_ACTION);
    }

    async beforeAction (action) {
    }

    async afterAction (action) {
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