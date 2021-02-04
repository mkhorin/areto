/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const AZ_REGEX = /([A-Z]+)/g;
const CAMEL_REGEX = /[^A-Za-z0-9]+/g;
const DASH_REGEX = /^-/;
const UNDERSCORE_REGEX = /^_/;
const SEP_REGEX = /[-_.]+/g;
const SPACE_REGEX = / /g;
const WORD_CAP_REGEX = /(^([a-zA-Z\p{M}]))|([ -][a-zA-Z\p{M}])/g;

module.exports = class StringHelper {

    static generateLabel (name) {
        return this.capitalize(this.camelToWords(name).toLowerCase());
    }

    static capitalize (text) {
        text = typeof text === 'string' ? text : String(text);
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    static capitalizeWords (text) {
        text = typeof text === 'string' ? text : String(text);
        return text.replace(WORD_CAP_REGEX, $1 => $1.toUpperCase());
    }

    static toLowerCaseFirstLetter (text) {
        text = typeof text === 'string' ? text : String(text);
        return text.charAt(0).toLowerCase() + text.slice(1);
    }

    static toLowerCamelCase (text) {
        return this.toLowerCaseFirstLetter(this.toUpperCamelCase(text));
    }

    static toUpperCamelCase (text) {
        text = typeof text === 'string' ? text : String(text);
        return this.capitalizeWords(text.replace(CAMEL_REGEX, ' ')).replace(SPACE_REGEX, '');
    }

    static camelToWords (text) {
        text = typeof text === 'string' ? text : String(text);
        return text.replace(SEP_REGEX, ' ').replace(AZ_REGEX, ' $1').trim();
    }

    static camelToKebab (text) {
        text = typeof text === 'string' ? text : String(text);
        return text.replace(AZ_REGEX, '-$1').replace(DASH_REGEX, '').toLowerCase();
    }

    static camelToSnake (text) {
        text = typeof text === 'string' ? text : String(text);
        return text.replace(AZ_REGEX, '_$1').replace(UNDERSCORE_REGEX, '').toLowerCase();
    }

    static split (text, separator = ',') {
        if (Array.isArray(text)) {
            return text;
        }
        if (typeof text !== 'string') {
            return [];
        }
        return text.split(separator).map(item => item.trim()).filter(item => item.length);
    }

    static splitFirst (text, separator = '.') {
        const index = text.indexOf(separator);
        return index === -1 ? [text] : [text.substring(0, index), text.substring(index + 1)];
    }

    static splitLast (text, separator = '.') {
        const index = text.lastIndexOf(separator);
        return index === -1 ? [text] : [text.substring(0, index), text.substring(index + 1)];
    }

    static parseObject (text) {
        if (typeof text !== 'string') {
            return {};
        }
        const result = {};
        for (const item of text.split(',')) {
            const [key, value] = item.split(':');
            if (key !== '' && value !== undefined) {
                result[key.trim()] = value.trim();
            }
        }
        return result;
    }

    static trimEnd (text, end) {
        const index = typeof end === 'string' ? text.lastIndexOf(end) : -1;
        text = typeof text === 'string' ? text : String(text);
        return index === -1 ? text : text.substring(0, index);
    }
};