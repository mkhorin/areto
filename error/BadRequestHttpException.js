'use strict';

const Base = require('./HttpException');

module.exports = class BadRequestHttpException extends Base {

    constructor (err) {
        super(400, err || 'Bad request');
    }
};