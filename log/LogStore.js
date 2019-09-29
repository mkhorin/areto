/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class LogStore extends Base {

    init () {
    }

    save () {
        throw new Error('Need to override');
    }

    log () {
        CommonHelper.log(this.logger.module, this.constructor.name, ...arguments);
    }
};

const CommonHelper = require('../helper/CommonHelper');