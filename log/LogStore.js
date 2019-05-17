/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class LogStore extends Base {

    init () {
    }

    save (type, message, data) {
        throw new Error(this.wrapClassMessage('Need to override'));
    }

    log (type, message, data) {
        CommonHelper.log(type, message, data, this.constructor.name, this.logger.module);
    }
};

const CommonHelper = require('../helper/CommonHelper');