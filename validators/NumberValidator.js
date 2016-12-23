'use strict';

const Base = require('./Validator');

module.exports = class NumberValidator extends Base {

    constructor (config) {
        super(Object.assign({
            integerOnly: false,
            max: null,
            min: null,
            integerPattern: '^\\s*[+-]?\\d+\\s*$', // = /^\s*[+-]?\d+\s*$/,
            numberPattern: '^\\s*[-+]?[0-9]*\\.?[0-9]+([eE][-+]?[0-9]+)?\\s*$'
        }, config));
    }

    init () {
        super.init();
        this.createMessage('message', this.integerOnly ? 'Number must be a integer' : 'Value must be a number');
        if (this.min !== null) {
            this.createMessage('tooSmall', 'Value must be no less than {min}');
        }
        if (this.max !== null) {
            this.createMessage('tooBig', 'Value must be no greater than {max}');
        }
    }

    validateAttr (model, attr, cb) {
        let value = model.get(attr);
        this.validateValue(value, (err, msg, params)=> {
            if (!err) {
                msg ? this.addError(model, attr, msg, params)
                    : model.set(attr, parseFloat(value));    
            }            
            cb(err);
        });
    }

    validateValue (value, cb) {
        if (typeof value === 'object' || (value - parseFloat(value) + 1) < 0) {
            return cb(null, this.message);
        }
        let regex = new RegExp(this.integerOnly ? this.integerPattern : this.numberPattern);
        if (!regex.test(value)) {
            return cb(null, this.message);        
        }
        if (this.min !== null && value < this.min) {
            return cb(null, this.tooSmall, {min: this.min});
        } 
        if (this.max !== null && value > this.max) {
            return cb(null, this.tooBig, {max: this.max});
        }
        cb();
    }
};