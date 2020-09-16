/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Job extends Base {

    isCanceled () {
        return this._canceled;
    }

    run () {
        // place code here
    }

    cancel () {
        this._canceled = true;
    }

    async execute () {
        if (this._started) {
            throw new Error('Job has already started');
        }
        this._started = true;
        await PromiseHelper.setImmediate();
        await this.run();
    }

    log () {
        this.task.log(...arguments);
    }
};

const PromiseHelper = require('../helper/PromiseHelper');