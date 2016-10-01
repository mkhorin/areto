'use strict';

let Base = require('./Validator');

module.exports = class DefaultValueValidator extends Base {

    constructor (config) {
        super(Object.assign({
            value: null
        }, config));
    }

    init () {
        super.init();
        this.skipOnEmpty = false;
    }

    validateAttr (model, attr, cb) {
        if (this.isEmpty(model.get(attr))) {
            if (typeof this.value === 'function') {
                this.value.call(this, model, attr, cb);
            } else {
                model.set(attr, this.value);
                cb();
            }
        } else cb();
    }
};