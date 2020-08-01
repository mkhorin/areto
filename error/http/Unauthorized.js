/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../HttpException');

module.exports = class Unauthorized extends Base {

    constructor (err, data) {
        super(401, err || 'Unauthorized', data);
    }
};