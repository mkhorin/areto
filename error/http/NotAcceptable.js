/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../HttpException');

module.exports = class NotAcceptable extends Base {

    constructor (err, data) {
        super(406, err || 'Not acceptable', data);
    }
};