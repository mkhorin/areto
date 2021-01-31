/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Job extends Base {

    execute () {
        // place code here
    }

    isCanceled () {
        return this._canceled;
    }

    cancel () {
        this._canceled = true;
    }

    async start () {
        if (this._started) {
            throw new Error('Job has already started');
        }
        this._started = true;
        await PromiseHelper.setImmediate();
        await this.execute();
    }

    log () {
        this.task.log(...arguments);
    }
};

const PromiseHelper = require('../helper/PromiseHelper');