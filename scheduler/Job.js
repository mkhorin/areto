/**
 * @copyright Copyright (c) 2018 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Job extends Base {

    async run () {
        // place code here
    }

    isCanceled () {
        return this._canceled;
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
};

const PromiseHelper = require('../helper/PromiseHelper');