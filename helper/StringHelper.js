/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class StringHelper {

    static toFirstUpperCase (text) {
        text = typeof text === 'string' ? text : String(text);
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    static toFirstLowerCase (text) {
        text = typeof text === 'string' ? text : String(text);
        return text.charAt(0).toLowerCase() + text.slice(1);
    }

    static toWordFirstUpperCase (text) {
        text = typeof text === 'string' ? text : String(text);
        return text.replace(/(^([a-zA-Z\p{M}]))|([ -][a-zA-Z\p{M}])/g, $1 => $1.toUpperCase());
    }

    // send_email to SendEmail
    // who's online to WhoSOnline
    static camelize (text) {
        text = typeof text === 'string' ? text : String(text);
        return this.toWordFirstUpperCase(text.replace(/[^A-Za-z0-9]+/g, ' ')).replace(/ /g, '');
    }

    // PostTag to Post Tag
    static camelToWords (text) {
        text = typeof text === 'string' ? text : String(text);
        return text.replace(/[-_.]+/g, ' ').replace(/([A-Z]+)/g, ' $1').trim();
    }

    // PostType to post-type
    static camelToId (text) {
        text = typeof text === 'string' ? text : String(text);
        return text.replace(/([A-Z]+)/g, '-$1').replace(/^-/, '').toLowerCase();
    }

    // post-type to PostType
    static idToCamel (text) {
        text = typeof text === 'string' ? text : String(text);
        return this.toWordFirstUpperCase(text.split('-').join(' ')).replace(/ /g, '');
    }

    // 'k1: v1, k2: v2' to {k1: 'v1', k2: 'v2'}
    static parseObject (text) {
        if (typeof text !== 'string') {
            return {};
        }
        const result = {};
        for (let item of text.split(',')) {
            let [key, value] = item.split(':');
            if (key !== '' && value !== undefined) {
                result[key.trim()] = value.trim();
            }
        }
        return result;
    }
};