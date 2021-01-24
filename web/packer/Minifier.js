/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const BLOCK_COMMENT = /\/\*(\*(?!\/)|[^*])*\*\//g;
const MULTIPLE_SPACE = /\s\s+/g;

const Base = require('../../base/Base');

module.exports = class Minifier extends Base {

    execute (data) {
        if (typeof data !== 'string') {
            return String(data);
        }
        data = data.replace(BLOCK_COMMENT, '');
        data = data.replace(MULTIPLE_SPACE, ' ');
        return data;
    }
};