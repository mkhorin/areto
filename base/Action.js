'use strict';

const Base = require('./Base');

module.exports = class Action extends Base {

    run (cb) {
        cb('Action: Need override');
    }

    getRelativeModuleId () {
        return `${this.controller.ID}/${this.id}`;
    }

    getUniqueId () {
        return this.controller.module.getRoute(this.getRelativeModuleId());
    }

    execute (cb) {
        try {
            this.callback = cb;
            this.run(cb);
        } catch (err) {
            cb(err);
        }
    }

    complete (err) {
        this.callback && this.callback(err);
    }
};