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

    init () {
        super.init();
        this.createMessage('message', 'Invalid IP address');

        if (!this.ip4) {
            this.createMessage('ip4NotAllowed', 'Value must not be an IPv4 address');
        }
        if (!this.ip6) {
            this.createMessage('ip6NotAllowed', 'Value must not be an IPv6 address');
        }
    }

    validateAttr (model, attr, cb) {
        this.validateValue(model.get(attr), (err, msg, params)=> {
            if (!err) {
                msg ? this.addError(model, attr, msg, params)
                    : model.set(attr, model.get(attr).toLowerCase());    
            } 
            cb(err);
        });
    }

    validateValue (value, cb) {
        // make sure string length is limited to avoid DOS attacks
        if (typeof value !== 'string' || value.length > 128) {
            return cb(null, this.message);
        }
        if ((new RegExp(this.ip4Pattern)).test(value)) {
            return this.ip4 ? cb() : cb(null, this.ip4NotAllowed);
        }
        if ((new RegExp(this.ip6Pattern)).test(value)) {
            return this.ip6 ? cb() : cb(null, this.ip6NotAllowed);
        }
        cb(null, this.message);
    }
};