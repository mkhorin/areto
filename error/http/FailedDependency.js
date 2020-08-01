/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../HttpException');

module.exports = class FailedDependency extends Base {

    constructor (err, data) {
        super(424, err || 'Failed dependency', data);
    }
};