/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../HttpException');

module.exports = class Locked extends Base {

    constructor (err, data) {
        super(423, err || 'Resource is locked', data);
    }
};