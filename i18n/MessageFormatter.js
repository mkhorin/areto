'use strict';

const Base = require('../base/Base');

module.exports = class MessageFormatter extends Base {

    format (message, params, language) {
        if (!params) {
            return message;
        }        
        for (let key of Object.keys(params)) {
            let value = params[key];
            if (value instanceof Array) {
                value = value.join(', ');
            }
            message = message.replace(new RegExp(`{${key}}`,'g'), value);
        }
        return message;
    }
};