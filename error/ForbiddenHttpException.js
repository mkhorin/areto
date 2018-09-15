/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./HttpException');

module.exports = class ForbiddenHttpException extends Base {

    constructor (err) {
        super(403, err || 'Access is denied');
    }
};