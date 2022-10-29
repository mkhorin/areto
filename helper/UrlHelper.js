/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class UrlHelper {

    static parse (url) {
        let index = url.indexOf('#'), anchor;
        if (index !== -1) {
            anchor = url.substring(index + 1);
            url = url.substring(0, index);
        }
        index = url.indexOf('?');
        let path = index !== -1 ? url.substring(0, index) : url;
        if (path.charAt(0) === '/') {
            path = path.substring(1);
        }
        if (path.charAt(path.length - 1) === '/') {
            path = path.substring(0, path.length - 1);
        }
        const segments = path.split('/');
        const params = {};
        if (index === -1) {
            return {segments, params, anchor};
        }
        url = url.substring(index + 1);
        for (const param of url.split('&')) {
            index = param.indexOf('=');
            if (index !== -1) {
                params[param.substring(0, index)] = param.substring(index + 1);
            }
        }
        return {segments, params, anchor};
    }

    static serialize (data, encode) {
        if (!data) {
            return '';
        }
        const result = [];
        for (const key of Object.keys(data)) {
            const value = data[key];
            if (value !== undefined && value !== null) {
                result.push(key +'='+ (encode ? encodeURIComponent(value) : value));
            }
        }
        return result.join('&');
    }
};