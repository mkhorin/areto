/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class BodyParser extends Base {

    static DEFAULTS = {
        json: null,
        raw: null,
        text: null,
        urlencoded: {
            extended: true
        }
    };

    constructor (config) {
        super({
            depends: '#start',
            json: {},
            urlencoded: {},
            ...config
        });
    }

    init () {
        Object.keys(this.constructor.DEFAULTS).forEach(this.createParser, this);
    }

    createParser (name) {
        if (this[name]) {
            this.module.addHandler('use', bodyParser[name]({
                ...this.constructor.DEFAULTS[name],
                ...this[name]
            }));
        }
    }
};

const bodyParser = require('body-parser');