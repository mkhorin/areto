'use strict';

module.exports = class InflectorHelper {

    // capitalize first letters
    static ucwords (text) {
        return text.replace(/(^([a-zA-Z\p{M}]))|([ -][a-zA-Z\p{M}])/g, function ($1) {
            return $1.toUpperCase();
        });
    }

    // send_email -> SendEmail, who's online -> WhoSOnline
    static camelize (text) {
        return this.ucwords(text.replace(/[^A-Za-z0-9]+/g, ' ')).replace(/ /g, '');
    }

    // PostTag -> Post Tag
    static camelToWords (text) {
        return text.replace(/[-_\.]+/g, ' ').replace(/([A-Z]+)/g, ' $1').trim();
    }

    // PostType to post-type
    static camelToId (text) {
        return text.replace(/([A-Z]+)/g, '-$1').replace(/^-/, '').toLowerCase();
    }

    // post-type to PostType
    static idToCamel (text) {
        return this.ucwords(text.split('-').join(' ')).replace(/ /g, '');
    }
};