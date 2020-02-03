/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const BLOCK_COMMENT = /\/\*(\*(?!\/)|[^*])*\*\//g;
const DOUBLE_SPACE = /[ ]{2,}/g;

const Base = require('../../base/Base');

module.exports = class Minifier extends Base {

    execute (data) {
        if (typeof data !== 'string') {
            return String(data);
        }
        data = data.replace(DOUBLE_SPACE, '');
        data = data.replace(BLOCK_COMMENT, '');
        return data;
    }
};