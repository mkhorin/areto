'use strict';

const Base = require('./Validator');

module.exports = class IpValidator extends Base {

    constructor (config) {
        super(Object.assign({
            ip4: true,
            ip6: true,
            ip4Pattern: '^(?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9]))$',
            ip6Pattern: '^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$'
        }, config));
    }

    getMessage () {
        return this.createMessage(this.message, 'Invalid IP address');
    }

    getIp4NotAllowedMessage () {
        return this.createMessage(this.ip4NotAllowed, 'Value must not be an IPv4 address');
    }

    getIp6NotAllowedMessage () {
        return this.createMessage(this.ip6NotAllowed, 'Value must not be an IPv6 address');
    }

    validateAttr (model, attr, cb) {
        super.validateAttr(model, attr, err => {
            if (err) {
                return cb(err);
            }
            if (!model.hasError()) {
                model.set(attr, model.get(attr).toLowerCase());
            }
            cb();
        });
    }

    validateValue (value, cb) {
        if (typeof value !== 'string' || value.length > 64) {
            return cb(null, this.getMessage());
        }
        if ((new RegExp(this.ip4Pattern)).test(value)) {
            return this.ip4 ? cb() : cb(null, this.getIp4NotAllowedMessage());
        }
        if ((new RegExp(this.ip6Pattern)).test(value)) {
            return this.ip6 ? cb() : cb(null, this.getIp6NotAllowedMessage());
        }
        cb(null, this.getMessage());
    }
};