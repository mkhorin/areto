/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const CONSTANT_METHOD = 'getConstants';
const STATIC_METHOD = 'getStatics';

module.exports = class ClassHelper {

    static spawn (config, params) {
        if (typeof config === 'function') {
            return new config(params);
        }
        if (typeof config === 'string') {
            return new (params.module.getClass(config))(params);
        }
        if (params) {
            config = {...config, ...params};
        }
        return typeof config.Class === 'string'
            ? new (config.module.getClass(config.Class))(config)
            : new config.Class(config);
    }

    static normalizeConfig (config, params) {
        return Object.assign(typeof config === 'function'
            ? {Class: config}
            : config, params);
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
        let props = {...parentProps, ...chainProps};
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
            if (Array.isArray(childProp) && Array.isArray(parentProp)) {
                return [].concat(parentProp, childProp);
            }
            if (typeof childProp === 'object' && typeof parentProp === 'object') {
                return {...parentProp, ...childProp};
            }
        }
        return null;
    }
};

const util = require('util');