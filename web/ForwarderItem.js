/**
 * @copyright Copyright (c) 2024 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class ForwarderItem extends Base {

    /**
     * @param {Object} config
     * @param {string|Array} config.source - Source path
     * @param {string|Array|function} config.target - Target path
     * @param {Object} config.targetParams - Default target params
     * @param {Array} config.methods - Request methods: GET, POST
     */
    constructor (config) {
        super(config);
        const {regexp, keys} = this.createRegex(this.source);
        this.sourceRegex = regexp;
        this.sourceKeys = keys;
        this.createTargetHandler(this.target);
    }

    createRegex (data) {
        const params = Array.isArray(data) ? data : [data];
        return pathToRegexp.apply(this, params);
    }

    createTargetHandler (data) {
        if (typeof data === 'function') {
            this.customTargetHandler = data;
        } else {
            this.targetHandler = this.createHandler(data);
        }
    }

    createHandler (data) {
        const params = Array.isArray(data) ? data : [data];
        return compile.apply(this, params);
    }

    getCreationMessage () {
        return `Redirection ${this.source} to ${this.target} is enabled`;
    }

    resolveTarget (source, method) {
        if (this.methods && !this.methods.includes(method)) {
            return;
        }
        const data = this.sourceRegex.exec(source);
        if (!data) {
            return;
        }
        const params = {
            ...this.targetParams,
            ...this.getParams(data, this.sourceKeys)
        };
        const path = this.customTargetHandler
            ? this.customTargetHandler(data, params)
            : this.targetHandler(params);
        return {path, params};
    }

    getParams (data, keys) {
        const params = {};
        for (let i = 0; i < keys.length; ++i) {
            params[keys[i].name] = data[i + 1];
        }
        return params;
    }
};

const {pathToRegexp, compile} = require("path-to-regexp");