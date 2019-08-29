/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
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
        this.setHandler(Controller.EVENT_BEFORE_ACTION, this.beforeFilter);
        this.setHandler(Controller.EVENT_AFTER_ACTION, this.afterFilter);
    }

    isActive (action) {
        const moduleName = action.getRelativeModuleName();
        const id = this.owner instanceof Module ? moduleName : action.name;
        return !this.except.includes(id) && (!this.only || this.only.includes(id));
    }

    beforeFilter ({action}) {
        this._active = this.isActive(action);
        if (this._active) {
            return this.beforeAction(action);
        }
    }

    async afterFilter ({action}) {
        if (this._active) {
            return this.afterAction(action);
        }
    }

    beforeAction (action) {
    }

    afterAction (action) {
    }
};

const Module = require('../base/Module');
const Controller = require('../base/Controller');