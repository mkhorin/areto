/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const HTML_REGEX = /&(?!#?[a-zA-Z0-9]+;)/g;
const LT_REGEX = /</g;
const QT_REGEX = />/g;
const DOUBLE_QUOTE_REGEX = /"/g;
const SINGLE_QUOTE_REGEX = /'/g;
const REGEX = /[\-\[\]\/{}()*+?.\\^$|]/g;

module.exports = class EscapeHelper {

    static escapeHtml (text) {
        if (!text) {
            return '';
        }
        if (typeof text !== 'string') {
            text = String(text);
        }
        return text.replace(HTML_REGEX, '&amp;')
            .replace(LT_REGEX, '&lt;')
            .replace(QT_REGEX, '&gt;')
            .replace(SINGLE_QUOTE_REGEX, '&#39;')
            .replace(DOUBLE_QUOTE_REGEX, '&quot;');
    }

    static escapeRegex (text) {
        return typeof text === 'string'
            ? text.replace(REGEX, "\\$&")
            : text instanceof RegExp ? text : '';
    }

    static escapeTags (text) {
        if (text === '' || text === null || text === undefined) {
            return '';
        }
        if (typeof text !== 'string') {
            text = text.toString ? text.toString() : String(text);
        }
        return text.replace(LT_REGEX, '&lt;').replace(QT_REGEX, '&gt;');
    }

    static toRegex (value) {
        if (value instanceof RegExp) {
            return value;
        }
        value = this.escapeRegex(value);
        value = value.charAt(0) === '%' ? value.substring(1) : `^${value}`;
        value = value.charAt(value.length - 1) === '%' ? value.substring(0, value.length - 1) : `${value}$`;
        return new RegExp(value, 'i');
    }
};