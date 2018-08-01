'use strict';

const Base = require('../base/Base');

module.exports = class Deferred extends Base {

    execute (cb) {
        if (this._completed) {
            return cb();
        }
        try {
            this.setCompleteCallback(cb);
            run();
        } catch (err) {
            this.complete(err);
        }
    }

    isCompleted () {
        return this._completed;
    }

    setCompleteCallback (cb) {
        this._completeCallback = cb;
    }

    complete () {
        if (this._completed) {
            return false;
        }
        this._completed = true;
        if (this._completeCallback) {
            this._completeCallback.apply(this, arguments);
        }
    }
};