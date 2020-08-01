/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../HttpException');

module.exports = class MethodNotAllowed extends Base {

    constructor (err, data) {
        super(405, err || 'Method not allowed', data);
    }
};