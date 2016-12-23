'use strict';

const Base = require('./Base');
const path = require('path');

module.exports = class ModelFormatter extends Base {

    constructor (key, options) {
        super({key, options});
    }

    execute (model, cb, controller) {
        model.set(this.key, null);
        cb();
    }

    create (key, options, dir) {
        if (options && typeof options.name === 'string') {
            try {
                let Formatter = require(path.join(dir, `${options.name.toUpperCaseFirstLetter()}Formatter`));
                return new Formatter(key, options);
            } catch (err) {                          
            }
        }
        return null;
    }
};