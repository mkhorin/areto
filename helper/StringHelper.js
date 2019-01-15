/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class StringHelper {

    static toFirstUpperCase (str) {
        str = String(str);
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static toFirstLowerCase (str) {
        str = String(str);
        return str.charAt(0).toLowerCase() + str.slice(1);
    }

    static toWordFirstUpperCase (str) {
        return String(str).replace(/(^([a-zA-Z\p{M}]))|([ -][a-zA-Z\p{M}])/g, $1 => $1.toUpperCase());
    }

    // send_email -> SendEmail, who's online -> WhoSOnline
    static camelize (str) {
        return this.toWordFirstUpperCase(String(str).replace(/[^A-Za-z0-9]+/g, ' ')).replace(/ /g, '');
    }

    // PostTag -> Post Tag
    static camelToWords (str) {
        return String(str).replace(/[-_\.]+/g, ' ').replace(/([A-Z]+)/g, ' $1').trim();
    }

    // PostType to post-type
    static camelToId (str) {
        return String(str).replace(/([A-Z]+)/g, '-$1').replace(/^-/, '').toLowerCase();
    }

    // post-type to PostType
    static idToCamel (str) {
        return this.toWordFirstUpperCase(String(str).split('-').join(' ')).replace(/ /g, '');
    }
};