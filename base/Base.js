'use strict';

const MainHelper = require('../helpers/MainHelper');
const path = require('path');
const MODULE_FILENAME = 'module.js';

module.exports = class Base {

    static init (nodeModule) {
        if (nodeModule) {
            MainHelper.defineClassProperty(this, 'CLASS_FILE', nodeModule.filename);
            if (path.basename(nodeModule.filename) !== MODULE_FILENAME) {
                MainHelper.defineClassProperty(this, 'module', this.getClosestModule(nodeModule.filename));
            }
        }
        let constants = this.getClassProperties('getConstants', this);
        for (let name of Object.keys(constants)) {
            MainHelper.defineClassProperty(this, name, constants[name]);
        }
        let statics = this.getClassProperties('getStatics', this);
        for (let name of Object.keys(statics)) {
            MainHelper.defineClassProperty(this, name, statics[name], true);
        }        
        return this;
    }

    static getClosestModule (file) {
        let dir = MainHelper.getClosestDirByTarget(file, MODULE_FILENAME);
        let module = require(path.join(dir, MODULE_FILENAME));
        let Module = require('./Module');
        return module instanceof Module ? module : this.getClosestModule(dir);
    }

    static getExtendedProperties () {
        return [];
    }

    static getClassProperties (key, targetClass, childProps = {}) {
        let parentProps = key in targetClass ? targetClass[key].call(this) : {};
        let props = Object.assign({}, parentProps, childProps);
        if (this.getExtendedProperties) {
            for (let name of this.getExtendedProperties()) {
                let prop = this.getExtendedClassProperty(name, childProps[name], parentProps[name]);
                if (prop) {
                    props[name] = prop;
                }
            }
        }
        targetClass = Object.getPrototypeOf(targetClass);
        return targetClass ? this.getClassProperties(key, targetClass, props) : props;
    }

    static getExtendedClassProperty (name, childProp, parentProp) {
        if (childProp && parentProp) {
            if (childProp instanceof Array && parentProp instanceof Array) {
                return childProp.concat(parentProp);
            } else if (typeof childProp === 'object' && typeof parentProp === 'object') {
                return Object.assign({}, parentProp, childProp);
            }    
        }
        return null;
    }
    
    constructor (config) {
        if (config) {
            Object.assign(this, config);
        }
        this.init();
    }
    
    init () {}
};