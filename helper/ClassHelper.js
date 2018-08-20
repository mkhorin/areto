'use strict';

const MODULE_FILENAME = 'module.js';
const CONSTANT_METHOD = 'getConstants';
const STATIC_METHOD = 'getStatics';

module.exports = class ClassHelper {

    static normalizeInstanceConfig (config, params) {
        return Object.assign(typeof config === 'function'
            ? {Class: config}
            : config, params);
    }

    static createInstance (config, params) {
        if (typeof config === 'function') {
            return new config(params);
        }
        if (params) {
            Object.assign(config, params);
        }
        if (config && config.Class) {
            return new config.Class(config);
        }
        throw new Error(`Invalid class config: ${util.inspect(config)}`);
    }

    static resolveConfigClass (config, module) {
        if (config && typeof config.Class === 'string') {
            config.Class = module.require(config.Class);
        }
    }

    // to get value from Class[name] and (new Class)[name]
    static defineClassProp (Class, name, value, writable) {
        Object.defineProperty(Class, name, {value, writable});
        Object.defineProperty(Class.prototype, name, {value, writable});
    }

    static defineModuleClassProp (Class, nodeModule, moduleFileName = MODULE_FILENAME) {
        if (nodeModule) {
            this.defineClassProp(Class, 'CLASS_FILE', nodeModule.filename);
            if (path.basename(nodeModule.filename) !== moduleFileName) {
                this.defineClassProp(Class, 'module', this.getClosestModule(nodeModule.filename, moduleFileName));
            }
        }
    }

    static getClosestModule (file, moduleFileName = MODULE_FILENAME) {
        let dir = FileHelper.getClosestDir(file, moduleFileName);
        let Module = require('../base/Module');
        let module = require(path.join(dir, moduleFileName));
        return module instanceof Module
            ? module
            : this.getClosestModule(dir, moduleFileName);
    }

    static getParentModule (module, moduleFileName = MODULE_FILENAME) {
        try {
            let parent = require(path.join(module.CLASS_FILE, '../../../', moduleFileName));
            let Module = require('../base/Module');
            return parent instanceof Module && parent !== module ? parent : null;
        } catch (err) {
            return null;
        }
    }

    static defineConstantClassProps (Class, methodName = CONSTANT_METHOD) {
        let props = this.getClassProps(Class, methodName, Class, 'getExtendedClassProps');
        for (let name of Object.keys(props)) {
            this.defineClassProp(Class, name, props[name], false);
        }
    }

    static defineStaticClassProps (Class, methodName = STATIC_METHOD) {
        let props = this.getClassProps(Class, methodName, Class, 'getExtendedClassProps');
        for (let name of Object.keys(props)) {
            this.defineClassProp(Class, name, props[name], true);
        }
    }

    static getClassProps (targetClass, methodName, chainClass, extendedMethodName) {
        let parentClass = Object.getPrototypeOf(chainClass);
        let chainProps = chainClass[methodName] && chainClass[methodName] !== parentClass[methodName]
            ? chainClass[methodName].call(targetClass) : {};

        if (!Object.getPrototypeOf(parentClass)) {
            return chainProps;
        }
        let parentProps = this.getClassProps(targetClass, methodName, parentClass);
        let props = Object.assign({}, parentProps, chainProps);
        if (chainClass[extendedMethodName] instanceof Function) {
            for (let name of chainClass[extendedMethodName]()) {
                let prop = this.getExtendedClassProp(name, chainProps[name], parentProps[name]);
                if (prop) {
                    props[name] = prop;
                }
            }
        }
        return props;
    }

    static getExtendedClassProp (name, childProp, parentProp) {
        if (childProp && parentProp) {
            if (childProp instanceof Array && parentProp instanceof Array) {
                return [].concat(parentProp, childProp);
            }
            if (typeof childProp === 'object' && typeof parentProp === 'object') {
                return Object.assign({}, parentProp, childProp);
            }
        }
        return null;
    }
};

const path = require('path');
const util = require('util');
const FileHelper = require('./FileHelper');