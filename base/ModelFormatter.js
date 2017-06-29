'use strict';

const Base = require('./Base');

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
                let Formatter = require(path.join(dir, `${StringHelper.toFirstUpperCase(options.name)}Formatter`));
                return new Formatter(key, options);
            } catch (err) {                          
            }
        }
        return null;
    }
};

const path = require('path');
const StringHelper = require('../helpers/StringHelper');