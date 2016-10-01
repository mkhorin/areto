'use strict';

let Base = require('../base/Base');
let helper = require('../helpers/main');

module.exports = class Serializer extends Base {

    stringify (value) {
        return value;
    }

    parse (value) {
        return value;
    }
};