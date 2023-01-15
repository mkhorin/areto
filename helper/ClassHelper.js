/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class ClassHelper {

    static resolveSpawn (config, module, ...args) {
        config = this.normalizeSpawn(config, ...args);
        if (config) {
            config.Class = this.resolveSpawnClass(config.Class, module);
        }
        return config;
    }

    static resolveSpawnClass (cls, module) {
        return typeof cls !== 'function'
            ? module.getClass(cls) || module.require(cls) || require(cls)
            : cls;
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
            return this.spawnByKey(config, params);
        }
        if (params) {
            config = {...config, ...params};
        }
        if (typeof config.Class === 'function') {
            return new config.Class(config);
        }
        return this.spawnByKey(config.Class, config);
    }

    static spawnByKey (key, config) {
        const Class = config.module.getClass(key);
        if (typeof Class === 'function') {
            return new Class(config);
        }
        throw new Error(`Invalid class key: ${key}`);
    }

    /**
     * Set property value accessible from Class and class instances
     * @param Class - constructor
     * @param {string} name
     * @param {*} value
     * @param {boolean} writable
     */
    static defineClassProperty (Class, name, value, writable = false) {
        Object.defineProperty(Class, name, {value, writable});
        Object.defineProperty(Class.prototype, name, {value, writable});
    }

    static defineConstantClassProperties (Class) {
        const data = this.getClassPropertyMap(Class, 'getConstants', Class, 'getExtendedClassProperties');
        for (const key of Object.keys(data)) {
            this.defineClassProperty(Class, key, Object.freeze(data[key]));
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
            if (Array.isArray(child)) {
                if (Array.isArray(parent)) {
                    return [...parent, ...child];
                }
            }
            if (typeof child === 'object') {
                if (typeof parent === 'object') {
                    return {...parent, ...child};
                }
            }
        }
        return null;
    }
};