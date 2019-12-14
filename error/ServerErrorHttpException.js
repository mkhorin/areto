/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./HttpException');

module.exports = class ServerErrorHttpException extends Base {

    constructor (err, data) {
        super(500, err || 'Internal server error', data);
    }
};