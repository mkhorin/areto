/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const CONSTANT_METHOD = 'getConstants';
const EXTENDED_CLASS_PROPS_METHOD = 'getExtendedClassProps';

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

    static normalizeSpawn (config, params, defaults) {
        config = typeof config === 'function' ? {Class: config} : config;
        if (defaults) {
            config = {...defaults, ...config};
        }
        return Object.assign(config, params);
    }

    static resolveSpawnClass (config, module) {
        if (config && typeof config.Class === 'string') {
            config.Class = module.getClass(config.Class) || module.require(config.Class) || require(config.Class);
        }
        return config;
    }

    // to get value from Class[name] and (new Class)[name]
    static defineClassProp (Class, name, value, writable) {
        Object.defineProperty(Class, name, {value, writable});
        Object.defineProperty(Class.prototype, name, {value, writable});
    }

    static defineConstantClassProps (Class, methodName = CONSTANT_METHOD) {
        const props = this.getClassProps(Class, methodName, Class, EXTENDED_CLASS_PROPS_METHOD);
        for (let name of Object.keys(props)) {
            this.defineClassProp(Class, name, props[name], false);
        }
    }

    static getClassProps (targetClass, methodName, chainClass, extendedMethodName) {
        const parentClass = Object.getPrototypeOf(chainClass);
        const chainProps = chainClass[methodName] && chainClass[methodName] !== parentClass[methodName]
            ? chainClass[methodName].call(targetClass)
            : {};
        if (!Object.getPrototypeOf(parentClass)) {
            return chainProps;
        }
        const parentProps = this.getClassProps(targetClass, methodName, parentClass);
        const props = {...parentProps, ...chainProps};
        if (typeof chainClass[extendedMethodName] === 'function') {
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
                return [...parentProp, ...childProp];
            }
            if (typeof childProp === 'object' && typeof parentProp === 'object') {
                return {...parentProp, ...childProp};
            }
        }
        return null;
    }
};