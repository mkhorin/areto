/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
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
        super({
            tasks: {},
            refreshInterval: 60, // sec
            ...config
        });
        this._taskMap = {};
        this._taskBeforeRunHandler = this.taskBeforeRun.bind(this);
        this._taskDoneHandler = this.taskDone.bind(this);
        this._taskFailHandler = this.taskFail.bind(this);
    }

    init () {
        this.addTasks(this.tasks);
        this.module.app.on(this.module.app.EVENT_AFTER_START, this.refresh.bind(this));
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

    // TASKS
    
    getTask (name) {
        return this._taskMap[name] instanceof Task ? this._taskMap[name] : null;
    }

    addTasks (data, params) {
        if (data) {
            for (let name of Object.keys(data)) {
                this.addTask(name, data[name], params);
            }
        }
    }

    addTask (name, config, params) {
        if (this.getTask(name)) {
            return this.log('error', `Task already exists: ${name}`);
        }
        try {
            this._taskMap[name] = this.createTask(name, config, params);
            this._taskMap[name].init();
            this.log('info', `Task added: ${name}`);
        } catch (err) {
            this.log('error', `Invalid task: ${name}`, err);
        }
    }

    createTask (name, config, params) {
        config.Class = config.Class || Task;
        const task = this.spawn(config, {...params, name, scheduler: this});
        task.on(task.EVENT_BEFORE_RUN, this._taskBeforeRunHandler);
        task.on(task.EVENT_DONE, this._taskDoneHandler);
        task.on(task.EVENT_FAIL, this._taskFailHandler);
        return task;
    }

    removeTask (name) {
        const task = this.getTask(name);
        if (!task) {
            return this.log('error', `Task not found: ${name}`);
        }
        try {
            this.detachTask(task);
            delete this._taskMap[name];
            this.log('info', `Task removed: ${name}`);
            return true;
        } catch (err) {
            this.log('error', `Task removal failed: ${name}`, err);
        }
    }

    detachTask (task) {
        task.off(task.EVENT_BEFORE_RUN, this._taskBeforeRunHandler);
        task.off(task.EVENT_DONE, this._taskDoneHandler);
        task.off(task.EVENT_FAIL, this._taskFailHandler);
        task.stop();
    }

    executeTask (name) {
        const task = this.getTask(name);
        if (!task) {
            return this.log('error', `Task not found: ${name}`);
        }
        if (!task.isRunning()) {
            task.execute();
        }
    }

    taskBeforeRun (event) {
        return this.trigger(this.EVENT_TASK_BEFORE_RUN, event);
    }

    taskDone (event) {
        this.log('info', `Task done: ${event.sender.name}`, event.result);
        this.trigger(this.EVENT_TASK_DONE, event);
    }
    
    taskFail (event) {
        this.log('error', `Task failed: ${event.sender.name}:`, event.error);
        this.trigger(this.EVENT_TASK_FAIL, event);
    }
};
module.exports.init();

const Task = require('./Task');