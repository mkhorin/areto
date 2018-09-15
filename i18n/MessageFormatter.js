/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class MessageFormatter extends Base {

    format (message, params, language) {
        if (!params) {
            return message;
        }
        let formatter = this.i18n.module.components.formatter;
        for (let key of Object.keys(params)) {
            let value = params[key];
            if (value instanceof Array && value[1] && formatter) {
                value = formatter.format(value[0], value[1], Object.assign({language}, value[2]));
            }
            message = message.replace(new RegExp(`{${key}}`,'g'), value);
        }
        return message;
    }
};