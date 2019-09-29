/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class EscapeHelper {

    static escapeHtml (html) {
        if (typeof html !== 'string') {
            return '';
        }
        return html.replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
            .replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/'/g, '&#39;').replace(/"/g, '&quot;');
    }

    static escapeRegex (text) {
        return typeof text === 'string' ? text.replace(/[\-\[\]\/{}()*+?.\\^$|]/g, "\\$&") : '';
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