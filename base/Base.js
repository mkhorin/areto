'use strict';

const helper = require('../helpers/MainHelper');
const path = require('path');

module.exports = class Base {

    static init (nodeModule) {
        if (nodeModule) {
            helper.defineClassProperty(this, 'CLASS_FILE', nodeModule.filename);
            if (path.basename(nodeModule.filename) !== 'module.js') {
                let dir = helper.getClosestModuleDir(nodeModule.filename);
                helper.defineClassProperty(this, 'module', require(path.join(dir, 'module')));
            }
        }
        let constants = this.getClassProperties('getConstants', this);
        for (let name in constants) {
            helper.defineClassProperty(this, name, constants[name]);
        }
        let statics = this.getClassProperties('getStatics', this);
        for (let name in statics) {
            helper.defineClassProperty(this, name, statics[name], true);
        }        
        return this;
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