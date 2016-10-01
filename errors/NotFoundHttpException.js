'use strict';

let Base = require('./HttpException');

module.exports = class NotFoundHttpException extends Base {

    constructor (err) {
        super(404, err);
    }
};