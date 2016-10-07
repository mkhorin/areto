'use strict';

let Base = require('../base/Base');
let helper = require('../helpers/MainHelper');

module.exports = class Serializer extends Base {

    stringify (value) {
        return value;
    }

    parse (value) {
        return value;
    }
};