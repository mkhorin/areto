/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../HttpException');

module.exports = class ServiceUnavailable extends Base {

    constructor (err, data) {
        super(503, err || 'Service unavailable', data);
    }
};