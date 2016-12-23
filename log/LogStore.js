'use strict';

const Base = require('../base/Base');

module.exports = class LogStore extends Base {

    save (type, message, data) {
        throw new Error('LogStore: Required method');
    }
}