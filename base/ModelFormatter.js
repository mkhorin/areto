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
        if (!options || typeof options.name !== 'string') {
            return null;
        }
        try {
            let file = path.join(dir, `${StringHelper.toFirstUpperCase(options.name)}Formatter`);
            let Formatter = require(file);
            return new Formatter(key, options);
        } catch (err) {
        }
    }
};

const path = require('path');
const StringHelper = require('../helper/StringHelper');