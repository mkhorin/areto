'use strict';

const Base = require('./Component');

module.exports = class Task extends Base {

    static getConstants () {
        return {
            EVENT_BEFORE_RUN: 'beforeRun',
            EVENT_DONE: 'done',
            EVENT_FAIL: 'fail'
        };
    }

    constructor (config) {
        super(Object.assign({
            active: true,
            interval: 0, // seconds
            repeats: 0
        }, config));
    }

    init () {
        super.init();
        this.start();
    }

    canRepeat () {
        return this.repeats == 0 || this.counter < this.repeats;
    }

    inProgress () {
        return this._timer || this._runned;
    }
        
    // EVENTS

    beforeRun (cb) {        
        this.triggerCallback(this.EVENT_BEFORE_RUN, cb);
    }
    
    done (result) {
        this.trigger(this.EVENT_DONE, new ExtEvent({result}));
    }

    fail (error) {
        this.trigger(this.EVENT_FAIL, new ExtEvent({error}));
    }
    
    //

    run (cb) {
        cb(`${this.constructor.name}: ${this.id}: Run task here`);
    }

    restart () {
        this.stop();
        return this.start();
    }

    start () {
        if (this.inProgress()) {
            return true;
        }
        this.counter = 0;
        return this.next();
    }

    next () {
        if (this.active && this.interval > 0 && this.canRepeat()) {
            this._timer = setTimeout(this.execute.bind(this, ()=>{}), this.interval * 1000);
            return true;
        }
        return false;
    }

    stop () {
        clearTimeout(this._timer);
        this._timer = null;
    }

    execute (cb) {
        this.stop();
        if (this._runned) {
            let err = 'In progress now';
            this.fail(err);
            this.next();
            return cb(err);
        }
        this.beforeRun(err => {
            try {
                if (err) {
                    throw err;
                }
                this.scheduler.module.log('debug', `Task start: ${this.id}`);
                this._runned = true;
                this.run((err, result)=> {
                    ++this.counter;
                    this._runned = false;
                    err ? this.fail(err) : this.done(result);
                    this.next();
                    cb(err, result);
                });
            } catch (err) {
                this.fail(err);
                cb(err);
            }
        });
    }
};

const ExtEvent = require('./ExtEvent');