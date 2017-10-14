'use strict';

const ClassHelper = require('../helpers/ClassHelper');

module.exports = class Base {

    static init (nodeModule) {
        ClassHelper.defineModuleClassProperty(this, nodeModule);
        ClassHelper.defineConstantClassProperties(this);
        ClassHelper.defineStaticClassProperties(this);
        return this;
    }

    constructor (config) {
        if (config) {
            Object.assign(this, config);
        }
        this.init();
    }

    init () {
    }
};