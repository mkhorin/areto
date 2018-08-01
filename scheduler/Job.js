'use strict';

const Base = require('../base/Base');

module.exports = class Job extends Base {

    run () {
        // place code here
        this.complete();
    }

    isCanceled () {
        return this._canceled;
    }

    isCompleted () {
        return this._completed;
    }

    execute (cb) {
        if (this._completeCallback) {
            return cb('Job has already runned');
        }
        this._completeCallback = cb;
        setImmediate(()=> {
            try {
                this.run();
            } catch (err) {
                this.complete(err);
            }
        });
    }

    cancel () {
        this._canceled = true;
    }

    complete (err, result) {
        if (this.isCompleted()) {
            return false;
        }
        this._completed = true;
        this.isCanceled()
            ? this._completeCallback('Job canceled')
            : this._completeCallback(err, result);
    }
};