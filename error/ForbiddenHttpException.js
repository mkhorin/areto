/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./HttpException');

module.exports = class ForbiddenHttpException extends Base {

    constructor (err) {
        super(403, err || 'Access denied');
    }
};