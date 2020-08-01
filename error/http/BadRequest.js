/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../HttpException');

module.exports = class BadRequest extends Base {

    constructor (err, data) {
        super(400, err || 'Bad request', data);
    }
};