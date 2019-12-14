/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./HttpException');

module.exports = class BadRequestHttpException extends Base {

    constructor (err, data) {
        super(400, err || 'Bad request', data);
    }
};