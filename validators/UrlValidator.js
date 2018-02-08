'use strict';

const Base = require('./Validator');

module.exports = class UrlValidator extends Base {

    constructor (config) {
        super(Object.assign({
            pattern: '^{schemes}:\\/\\/(([A-Z0-9][A-Z0-9_-]*)(\\.[A-Z0-9][A-Z0-9_-]*)+)',
            validSchemes: ['http', 'https'],
            defaultScheme: null,
            maxLength: 2000
        }, config));
    }

    getMessage () {
        return this.createMessage(this.message, 'Invalid url');
    }

    validateAttr (model, attr, cb) {
        let value = model.get(attr);
        this.validateValue(value, (err, message, params)=> {
            if (err) {
                return cb(err);
            }
            if (message) {
                this.addError(model, attr, message);
            } else if (this.defaultScheme !== null && value.indexOf('://') === -1) {
                model.set(attr, `${this.defaultScheme}://${value}`);
            }
            cb();
        });
    }

    validateValue (value, cb) {
        if (typeof value !== 'string' || value.length > this.maxLength) {
            return cb(null, this.getMessage());
        }
        if (this.defaultScheme !== null && value.indexOf('://') === -1) {
            value = `${this.defaultScheme}://${value}`;
        }
        let pattern = this.pattern;
        if (pattern.indexOf('{schemes}') !== -1) {
            pattern = pattern.replace('{schemes}', `(${this.validSchemes.join('|')})`);
        }
        cb(null, (new RegExp(pattern, 'i')).test(value) ? null : this.getMessage());
    }
};