'use strict';

let Base = require('../base/Base');

module.exports = class MessageFormatter extends Base {

    format (message, params, language) {
        if (!params) {
            return message;
        }        
        for (let key in params) {
            let value = params[key];
            if (value instanceof Date) {
                value = value.toLocaleDateString(language);
            }
            message = message.replace(new RegExp(`{${key}}`,'g'), value);
        }
        return message;
    }
};