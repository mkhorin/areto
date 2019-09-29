/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class MessageFormatter extends Base {

    constructor (config) {
        super({
            formatter: 'formatter',
            ...config
        });
        this.formatter = this.module.get(this.formatter);
    }

    format (message, params, language) {
        if (!params) {
            return message;
        }
        for (const key of Object.keys(params)) {
            let value = params[key];
            if (Array.isArray(value) && value[1] && this.formatter) {
                value = this.formatter.format(value[0], value[1], {language, ...value[2]});
            }
            message = message.replace(new RegExp(`{${key}}`,'g'), value);
        }
        return message;
    }
};