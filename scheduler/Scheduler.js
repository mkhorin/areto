'use strict';

const Base = require('../base/Component');

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
            tasks: {},
            refreshInterval: 60 // sec
        }, config));
        
        this._taskMap = {};
        this._taskBeforeRunHandler = this.taskBeforeRun.bind(this);
        this._taskDoneHandler = this.taskDone.bind(this);
        this._taskFailHandler = this.taskFail.bind(this);
        
        this.addTasks(this.tasks);
        this.module.app.on(this.module.app.EVENT_AFTER_START, this.refresh.bind(this));
    }
    
    getTask (name) {
        return this._taskMap[name] instanceof Task ? this._taskMap[name] : null;
    }

    addTasks (data) {
        if (data) {
            for (let name of Object.keys(data)) {
                this.addTask(name, data[name]);
            }
        }
    }

    addTask (name, config) {
        if (this.getTask(name)) {
            return this.log('error', `Task already exists: ${name}`);
        }
        try {
            config.Class = config.Class || Task;
            let task = ClassHelper.createInstance(config, {
                name,
                scheduler: this
            });
            task.on(task.EVENT_BEFORE_RUN, this._taskBeforeRunHandler);
            task.on(task.EVENT_DONE, this._taskDoneHandler);
            task.on(task.EVENT_FAIL, this._taskFailHandler);
            this.log('info', `Task has been added: ${name}`);
            return this._taskMap[name] = task;
        } catch (err) {
            this.log('error', `Invalid task: ${name}`, err);
        }
    }

    removeTask (name) {
        let task = this.getTask(name);
        if (!task) {
            return this.log('error', `Task not found: ${name}`);
        }
        try {
            task.off(task.EVENT_BEFORE_RUN, this._taskBeforeRunHandler);
            task.off(task.EVENT_DONE, this._taskDoneHandler);
            task.off(task.EVENT_FAIL, this._taskFailHandler);
            task.stop();
            delete this._taskMap[name];
            this.log('info', `Task has been removed: ${name}`);
            return true;
        } catch (err) {
            this.log('error', `Task removal is failed: ${name}`, err);
        }
    }

    executeTask (name) {
        let task = this.getTask(name);
        task && !task.isRunning() && task.execute();
    }

    isActive () {
        return !!this._timer;
    }

    start () {
        this.stop();
        this._timer = setTimeout(this.refresh.bind(this), this.refreshInterval * 1000);
    }

    stop () {
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
    }

    refresh () {
        for (let task of Object.values(this._taskMap)) {
            task.refresh();
        }
        this.start();
    }
    
    taskBeforeRun (cb, event) {
        this.triggerCallback(this.EVENT_TASK_BEFORE_RUN, cb, event);
    }

    taskDone (event, data) {
        this.log('info', `Task done: ${event.sender.name}:`, event.result);
        this.trigger(this.EVENT_TASK_DONE, event);
    }
    
    taskFail (event) {
        this.log('error', `Task failed: ${event.sender.name}:`, event.error);
        this.trigger(this.EVENT_TASK_FAIL, event);
    }
};
module.exports.init();

const ClassHelper = require('../helper/ClassHelper');
const Task = require('./Task');