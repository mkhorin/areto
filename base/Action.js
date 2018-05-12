'use strict';

const Base = require('./Base');

module.exports = class Action extends Base {

    run (cb) {
        cb(this.wrapClassMessage('Need to override'));
    }

    getRelativeModuleName () {
        return `${this.controller.NAME}/${this.name}`;
    }

    getUniqueName () {
        return this.controller.module.getRoute(this.getRelativeModuleName());
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
        if (this.callback) {
            this.callback(err);
        }
    }

    throwError () {
        return this.controller.throwError.apply(this.controller, arguments);
    }

    throwBadRequest () {
        return this.controller.throwBadRequest.apply(this.controller, arguments);
    }

    throwNotFound () {
        return this.controller.throwNotFound.apply(this.controller, arguments);
    }

    throwForbidden () {
        return this.controller.throwForbidden.apply(this.controller, arguments);
    }
};