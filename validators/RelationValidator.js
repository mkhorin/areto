'use strict';

let Base = require('./Validator');
let helper = require('../helpers/MainHelper');

module.exports = class RelationValidator extends Base {

    static getConstants () {
        return {
            CHANGES: ['links', 'unlinks', 'removes']
        };
    }

    constructor (config) {
        super(Object.assign({
            allow: null,
            deny: null
        }, config));
    }

    init () {
        super.init();
        if (this.allow && this.deny) {
            throw new Error('RelationValidator: Allowed only one permission');
        }
        this.createMessage('message', 'Invalid relation request');
    }

    validateAttr (model, attr, cb) {
        this.validateValue(model.get(attr), (err, msg, params, value)=> {
            if (!err) {
                msg ? this.addError(model, attr, msg, params) 
                    : model.set(attr, value);
            }
            cb(err);
        });
    }

    validateValue (value, cb) {
        let error = false;
        value = helper.parseJson(value);
        if (value) {
            for (let item of this.CHANGES) {
                if(!(value[item] instanceof Array)) {
                    error = true;
                }
            }    
        }
        if (!value || error) {
            cb(null, this.message);
        } else {
            this.filterValue(value);
            cb(null, null, null, value);
        }
    }

    filterValue (value) {
        if (this.allow) {
            for (let item of this.CHANGES) {
                if (!this.allow.includes(item)) {
                    value[item] = [];
                }
            }
        }
        if (this.deny) {
            for (let item of this.CHANGES) {
                if (this.deny.includes(item)) {
                    value[item] = [];
                }
            }
        }
    }
};
module.exports.init();