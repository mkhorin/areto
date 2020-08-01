/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../HttpException');

module.exports = class Gone extends Base {

    constructor (err, data) {
        super(410, err || 'Resource is gone', data);
    }
};