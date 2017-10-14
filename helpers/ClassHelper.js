'use strict';

const MODULE_FILENAME = 'module.js';
const CONSTANT_METHOD = 'getConstants';
const STATIC_METHOD = 'getStatics';

module.exports = class ClassHelper {

    static createInstance (config, params) {
        if (typeof config === 'function') {
            return new config(params);
        }
        if (params) {
            Object.assign(config, params);
        }
        return config && config.Class ? new config.Class(config) : null;
    }
   
    // get value from Class[name] and (new Class)[name]
    static defineClassProperty (Class, name, value, writable) {
        Object.defineProperty(Class, name, {value, writable});
        Object.defineProperty(Class.prototype, name, {value, writable});
    }

    static defineModuleClassProperty (Class, nodeModule, moduleFileName = MODULE_FILENAME) {
        if (nodeModule) {
            this.defineClassProperty(Class, 'CLASS_FILE', nodeModule.filename);
            if (path.basename(nodeModule.filename) !== moduleFileName) {
                this.defineClassProperty(Class, 'module', this.getClosestModule(nodeModule.filename, moduleFileName));
            }
        }
    }

    static getClosestModule (file, moduleFileName = MODULE_FILENAME) {
        let dir = FileHelper.getClosestDirByTarget(file, moduleFileName);
        let Module = require('../base/Module');
        let module = require(path.join(dir, moduleFileName));
        return module instanceof Module ? module : this.getClosestModule(dir, moduleFileName);
    }

    static defineConstantClassProperties (Class, methodName = CONSTANT_METHOD) {
        let props = this.getClassProperties(Class, methodName, Class);
        for (let name of Object.keys(props)) {
            this.defineClassProperty(Class, name, props[name]);
        }
    }

    static defineStaticClassProperties (Class, methodName = STATIC_METHOD) {
        let props = this.getClassProperties(Class, methodName, Class);
        for (let name of Object.keys(props)) {
            this.defineClassProperty(Class, name, props[name], true);
        }
    }

    static getClassProperties (Class, methodName, targetClass, childProps = {}) {
        let parentProps = methodName in targetClass ? targetClass[methodName].call(Class) : {};
        let props = Object.assign({}, parentProps, childProps);
        if (Class.getExtendedProperties) {
            for (let name of Class.getExtendedProperties()) {
                let prop = this.getExtendedClassProperty(name, childProps[name], parentProps[name]);
                if (prop) {
                    props[name] = prop;
                }
            }
        }
        targetClass = Object.getPrototypeOf(targetClass);
        return targetClass ? this.getClassProperties(Class, methodName, targetClass, props) : props;
    }

    static getExtendedClassProperty (name, childProp, parentProp) {
        if (childProp && parentProp) {
            if (childProp instanceof Array && parentProp instanceof Array) {
                return childProp.concat(parentProp);
            }
            if (typeof childProp === 'object' && typeof parentProp === 'object') {
                return Object.assign({}, parentProp, childProp);
            }
        }
        return null;
    }
};

const path = require('path');
const FileHelper = require('./FileHelper');