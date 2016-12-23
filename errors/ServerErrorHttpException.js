'use strict';

const Base = require('./HttpException');

module.exports = class ServerErrorHttpException extends Base {

    constructor (err) {
        super(500, err);
    }
};