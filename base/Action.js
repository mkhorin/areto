'use strict';

const Base = require('./Base');

module.exports = class Action extends Base {

    run () {
        this.complete(this.wrapClassMessage('Need to override'));
    }

    getRelativeModuleName () {
        return `${this.controller.NAME}/${this.name}`;
    }

    getUniqueName () {
        return this.controller.module.getRoute(this.getRelativeModuleName());
    }

    execute (cb) {
        if (this.isCompleted()) {
            return cb();
        }
        try {
            this._completeCallback = cb;
            this.run();
        } catch (err) {
            this.complete(err);
        }
    }

    isCompleted () {
        return this._completed;
    }

    complete (err) {
        if (this.isCompleted()) {
            return false;
        }
        this._completed = true;
        if (this._completeCallback) {
            this._completeCallback(err);
        }
    }

    render (name, params, cb) {
        this.controller.render(name, params, (err, content)=> {
            if (!err) {
                this.controller.send(content);
            }
            cb(err);
        });
    }

    // THROW

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