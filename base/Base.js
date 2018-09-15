/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const ClassHelper = require('../helper/ClassHelper');

module.exports = class Base {

    static init (nodeModule) {
        ClassHelper.defineModuleClassProp(this, nodeModule);
        ClassHelper.defineConstantClassProps(this);
        ClassHelper.defineStaticClassProps(this);
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

    wrapClassMessage (message) {
        return this.constructor.wrapClassMessage(message);
    }
};

// default - JSON.stringify(new RegExp) = {}
RegExp.prototype.toJSON = RegExp.prototype.toString;