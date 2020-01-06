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
            refreshInterval: 60, // seconds
            Task: require('./Task'),
            ...config
        });
        this._taskMap = new DataMap;
        this._taskBeforeRunHandler = this.taskBeforeRun.bind(this);
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
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
    }

    async refresh () {
        for (const task of this._taskMap) {
            await task.refresh();
        }
        this.start();
    }

    // TASKS
    
    getTask (id) {
        return this._taskMap.get(id);
    }

    addTasks (data, params) {
        if (data) {
            for (const id of Object.keys(data)) {
                this.addTask(id, data[id], params);
            }
        }
    }

    addTask (id, config, params) {
        if (this.getTask(id)) {
            return this.log('error', `Task already exists: ${id}`);
        }
        try {
            const task = this.createTask(id, config, params);
            task.init();
            this._taskMap.set(id, task);
            this.log('info', `Task added: ${id}`);
        } catch (err) {
            this.log('error', `Invalid task: ${id}`, err);
        }
    }

    createTask (id, config, params) {
        config = {...this.Task, ...config};
        const task = this.spawn(config, {...params, id, scheduler: this});
        task.on(task.EVENT_BEFORE_RUN, this._taskBeforeRunHandler);
        task.on(task.EVENT_DONE, this._taskDoneHandler);
        task.on(task.EVENT_FAIL, this._taskFailHandler);
        return task;
    }

    deleteTask (id) {
        const task = this.getTask(id);
        if (!task) {
            return this.log('error', `Task not found: ${id}`);
        }
        if (this.detachTask(task)) {
            this._taskMap.unset(id);
            this.log('info', `Task deleted: ${id}`);
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
            this.log('error', `Task detaching failed: ${task.id}`, err);
        }
    }

    async executeTasks (ids) {
        if (Array.isArray(ids)) {
            for (const id of ids) {
                await this.executeTask(id);
            }
        }
    }

    executeTask (id) {
        const task = this.getTask(id);
        if (!task) {
            return this.log('error', `Task not found: ${id}`);
        }
        return task.isActive() ? task.execute() : null;
    }

    taskBeforeRun (event) {
        return this.trigger(this.EVENT_TASK_BEFORE_RUN, event);
    }

    taskDone (event) {
        this.log('info', `Task done: ${event.sender.id}`, event.result);
        return this.trigger(this.EVENT_TASK_DONE, event);
    }
    
    taskFail (event) {
        this.log('error', `Task failed: ${event.sender.id}:`, event.error);
        return this.trigger(this.EVENT_TASK_FAIL, event);
    }
};
module.exports.init();

const ClassHelper = require('../helper/ClassHelper');
const DataMap = require('../base/DataMap');