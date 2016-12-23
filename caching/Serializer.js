'use strict';

const Base = require('../base/Base');
const helper = require('../helpers/MainHelper');

module.exports = class Serializer extends Base {

    stringify (value) {
        return value;
    }

    parse (value) {
        return value;
    }
};