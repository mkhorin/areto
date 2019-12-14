/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./HttpException');

module.exports = class ForbiddenHttpException extends Base {

    constructor (err, data) {
        super(403, err || 'Access denied', data);
    }
};