/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../base/Base');

module.exports = class Rule extends Base {

    isEqual (a, b) {
        return a === b || JSON.stringify(a) === JSON.stringify(b);
    }

    getUser () {
        return this.params.controller.user;
    }

    async execute () {
        return false;
    }

    log () {
        CommonHelper.log(this.inspector, this.constructor.name, ...arguments);
    }
};

const CommonHelper = require('../../helper/CommonHelper');