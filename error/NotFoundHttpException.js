/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./HttpException');

module.exports = class NotFoundHttpException extends Base {

    constructor (err) {
        super(404, err || 'Resource is not found');
    }
};