/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../HttpException');

module.exports = class NotImplemented extends Base {

    constructor (err, data) {
        super(501, err || 'Not implemented', data);
    }
};