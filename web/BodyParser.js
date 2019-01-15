/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class BodyParser extends Base {

    constructor (config) {
        super({
            'depends': '#start',
            ...config
        });
        this.jsonParser = bodyParser.json();
        this.urlencodeParser = bodyParser.urlencoded(config);
    }

    init () {
        this.module.addHandler('use', this.jsonParser);
        this.module.addHandler('use', this.urlencodeParser);
    }
};

const bodyParser = require('body-parser');