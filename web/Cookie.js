/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class Cookie extends Base {

    constructor (config) {
        super({
            // secret: 'key' // // key to sign cookie
            // options: {} // cookie options
            ...config
        });
    }

    init () {
        this.module.addHandler('use', cookieParser(this.secret, this.options));
    }
};

const cookieParser = require('cookie-parser');