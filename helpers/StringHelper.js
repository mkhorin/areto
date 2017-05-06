'use strict';

module.exports = class StringHelper {

    // capitalize first letters
    static ucwords (str) {
        return str.replace(/(^([a-zA-Z\p{M}]))|([ -][a-zA-Z\p{M}])/g, function ($1) {
            return $1.toUpperCase();
        });
    }

    // send_email -> SendEmail, who's online -> WhoSOnline
    static camelize (str) {
        return this.ucwords(str.replace(/[^A-Za-z0-9]+/g, ' ')).replace(/ /g, '');
    }

    // PostTag -> Post Tag
    static camelToWords (str) {
        return str.replace(/[-_\.]+/g, ' ').replace(/([A-Z]+)/g, ' $1').trim();
    }

    // PostType to post-type
    static camelToId (str) {
        return str.replace(/([A-Z]+)/g, '-$1').replace(/^-/, '').toLowerCase();
    }

    // post-type to PostType
    static idToCamel (str) {
        return this.ucwords(str.split('-').join(' ')).replace(/ /g, '');
    }
};