/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../HttpException');

module.exports = class Conflict extends Base {

    constructor (err, data) {
        super(409, err || 'Conflict', data);
    }
};