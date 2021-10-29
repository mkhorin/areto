/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class Scheduler extends Base {

    static getConstants () {
        return {
            EVENT_TASK_BEFORE_EXECUTE: 'taskBeforeExecute',
            EVENT_TASK_DONE: 'taskDone',
            EVENT_TASK_FAIL: 'taskFail'
        };
    }

    /**
     * @param {Object} config
     * @param {number} config.refreshInterval - In seconds
     */
    constructor (config) {
        super({
            tasks: {},
            refreshInterval: 60,
            Task: require('./Task'),
            ...config
        });
        this._taskMap = new DataMap;
        this._taskBeforeExecuteHandler = this.taskBeforeExecute.bind(this);
        this._taskDoneHandler = this.taskDone.bind(this);
        this._taskFailHandler = this.taskFail.bind(this);
        this.Task = ClassHelper.normalizeSpawn(this.Task);
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
        clearTimeout(this._timer);
        this._timer = null;
    }

    async refresh () {
        for (const task of this._taskMap) {
            await task.refresh();
        }
        this.start();
    }

    // TASKS
    
    getTask (name) {
        return this._taskMap.get(name);
    }

    addTasks (data, params) {
        if (data) {
            for (const name of Object.keys(data)) {
                this.addTask(name, data[name], params);
            }
        }
    }

    addTask (name, config, params) {
        if (this.getTask(name)) {
            return this.log('error', `Task already exists: ${name}`);
        }
        try {
            const task = this.createTask(name, config, params);
            task.init();
            this._taskMap.set(name, task);
            this.log('info', `Task added: ${name}`);
        } catch (err) {
            this.log('error', `Invalid task: ${name}`, err);
        }
    }

    createTask (name, config, params) {
        config = {...this.Task, ...config};
        const task = this.spawn(config, {...params, name, scheduler: this});
        task.on(task.EVENT_BEFORE_EXECUTE, this._taskBeforeExecuteHandler);
        task.on(task.EVENT_DONE, this._taskDoneHandler);
        task.on(task.EVENT_FAIL, this._taskFailHandler);
        return task;
    }

    deleteTask (name) {
        const task = this.getTask(name);
        if (!task) {
            return this.log('error', `Task not found: ${name}`);
        }
        if (this.detachTask(task)) {
            this._taskMap.unset(name);
            this.log('info', `Task deleted: ${name}`);
            return true;
        }
    }

    deleteAllTasks () {
        for (const task of this._taskMap) {
            this.detachTask(task);
        }
        this._taskMap.clear();
    }

    detachTask (task) {
        try {
            task.off();
            task.stop();
            return true;
        } catch (err) {
            this.log('error', `Task detaching failed: ${task.name}`, err);
        }
    }

    async executeTasks (names) {
        if (Array.isArray(names)) {
            for (const name of names) {
                await this.executeTask(name);
            }
        }
    }

    executeTask (name) {
        const task = this.getTask(name);
        if (!task) {
            return this.log('error', `Task not found: ${name}`);
        }
        return task.isActive() ? task.execute() : null;
    }

    taskBeforeExecute (event) {
        return this.trigger(this.EVENT_TASK_BEFORE_EXECUTE, event);
    }

    taskDone (event) {
        this.log('info', `Task done: ${event.sender.name}`, event.result);
        return this.trigger(this.EVENT_TASK_DONE, event);
    }
    
    taskFail (event) {
        this.log('error', `Task failed: ${event.sender.name}:`, event.error);
        return this.trigger(this.EVENT_TASK_FAIL, event);
    }
};
module.exports.init();

const ClassHelper = require('../helper/ClassHelper');
const DataMap = require('../base/DataMap');