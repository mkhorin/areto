/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const path = require('path');
const ClassHelper = require('../helper/ClassHelper');

module.exports = class Base {

    static init (nodeModule) {
        if (nodeModule) {
            ClassHelper.defineClassProp(this, 'CLASS_FILE', nodeModule.filename);
            ClassHelper.defineClassProp(this, 'CLASS_DIR', path.dirname(nodeModule.filename));
        }
        ClassHelper.defineConstantClassProps(this);
        return this;
    }

    static wrapClassMessage (message) {
        return `${this.name}: ${message}`;
    }

    constructor (config) {
        if (config) {
            Object.assign(this, config);
        }
    }

    getClass () {
        return this.module.getClass(...arguments);
    }

    spawn (config, params) {
        if (!params) {
            params = {module: this.module};
        } else if (!params.module) {
            params.module = this.module;
        }
        return ClassHelper.spawn(config || this.constructor, params);
    }

    wrapClassMessage (message) {
        return this.constructor.wrapClassMessage(message);
    }
};

// default - JSON.stringify(new RegExp) = {}
RegExp.prototype.toJSON = RegExp.prototype.toString;