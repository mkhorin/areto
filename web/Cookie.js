/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class Cookie extends Base {

    /**
     * @param {Object} config
     * @param {string} config.secret - Key to sign cookie
     * @param {Object} config.options - Cookie options
     */
    constructor (config) {
        super(config);
    }

    init () {
        this.module.addHandler('use', cookieParser(this.secret, this.options));
    }
};

const cookieParser = require('cookie-parser');