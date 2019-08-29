/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class ClassHelper {

    static resolveSpawn (config, module, ...args) {
        config = this.normalizeSpawn(config, ...args);
        if (config && typeof config.Class !== 'function') {
            config.Class = module.getClass(config.Class) || module.require(config.Class) || require(config.Class);
        }
        return config;
    }

    static normalizeSpawn (config, params, defaults) {
        if (!config) {
            return params || defaults ? {...defaults, ...params} : config;
        }
        if (typeof config !== 'object') {
            config = {Class: config};
        }
        if (defaults) {
            config = {...defaults, ...config};
        }
        return Object.assign(config, params);
    }

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
        return typeof config.Class === 'function'
            ? new config.Class(config)
            : new (config.module.getClass(config.Class))(config);
    }

    // to get value from Class[name] and (new Class)[name]
    static defineClassProperty (Class, name, value, writable) {
        Object.defineProperty(Class, name, {value, writable});
        Object.defineProperty(Class.prototype, name, {value, writable});
    }

    static defineConstantClassProperties (Class) {
        const data = this.getClassPropertyMap(Class, 'getConstants', Class, 'getExtendedClassProperties');
        for (const key of Object.keys(data)) {
            this.defineClassProperty(Class, key, data[key], false);
        }
    }

    static getClassPropertyMap (targetClass, method, chainClass, extendedMethod) {
        const parentClass = Object.getPrototypeOf(chainClass);
        const hasOwnMethod = chainClass[method] && chainClass[method] !== parentClass[method];
        const chainMap = hasOwnMethod ? chainClass[method].call(targetClass) : {};
        if (!Object.getPrototypeOf(parentClass)) {
            return chainMap;
        }
        const parentMap = this.getClassPropertyMap(targetClass, method, parentClass, extendedMethod);
        const data = {...parentMap, ...chainMap};
        if (typeof chainClass[extendedMethod] === 'function') {
            for (const name of chainClass[extendedMethod]()) {
                const property = this.getExtendedClassProperty(name, chainMap[name], parentMap[name]);
                if (property) {
                    data[name] = property;
                }
            }
        }
        return data;
    }

    static getExtendedClassProperty (name, child, parent) {
        if (child && parent) {
            if (Array.isArray(child) && Array.isArray(parent)) {
                return [...parent, ...child];
            }
            if (typeof child === 'object' && typeof parent === 'object') {
                return {...parent, ...child};
            }
        }
        return null;
    }
};