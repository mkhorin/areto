'use strict';

const Base = require('./Component');

module.exports = class Scheduler extends Base {

    static getConstants () {
        return {
            EVENT_TASK_BEFORE_RUN: 'taskBeforeRun',
            EVENT_TASK_DONE: 'taskDone',
            EVENT_TASK_FAIL: 'taskFail'
        };
    }

    constructor (config) {
        super(Object.assign({                        
            tasks: {}
        }, config));
    }

    init () {
        super.init();
        for (let id in this.tasks) {
            let task = ClassHelper.createInstance(this.tasks[id], {
                id,
                scheduler: this
            });
            task.on(task.EVENT_BEFORE_RUN, this.taskBeforeRun.bind(this));
            task.on(task.EVENT_DONE, this.taskDone.bind(this));
            task.on(task.EVENT_FAIL, this.taskFail.bind(this));
            this.tasks[id] = task;
        }
    }
    
    taskBeforeRun (event, cb) {
        this.triggerCallback(this.EVENT_TASK_BEFORE_RUN, cb, event);
    }

    taskDone (event, cb, data) {
        this.log('info', `Task done: ${event.sender.id}:`, event.result);
        this.trigger(this.EVENT_TASK_DONE, event);
    }
    
    taskFail (event) {
        this.log('error', `${this.constructor.name}: ${event.sender.id}`, event.err);
        this.trigger(this.EVENT_TASK_FAIL, event);
    }
};
module.exports.init();

const ClassHelper = require('../helpers/ClassHelper');