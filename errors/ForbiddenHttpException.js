'use strict';

let Base = require('./HttpException');

module.exports = class ForbiddenHttpException extends Base {

    constructor (err) {
        super(403, err);
    }
};