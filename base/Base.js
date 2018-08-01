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
        this.init();
    }

    init () {
    }

    wrapClassMessage (message) {
        return this.constructor.wrapClassMessage(message);
    }
};