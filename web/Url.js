/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Url extends Base {

    constructor (config) {
        super(config);

        const sources = pathToRegexp.parse(this.source);
        const targets = pathToRegexp.parse(this.target);

        this.sourceParamNames = this.getParamNames(sources);
        this.targetParamNames = this.getParamNames(targets);

        this.sourceRegExp = pathToRegexp.tokensToRegExp(sources);
        this.targetRegExp = pathToRegexp.tokensToRegExp(targets);
        this.createSource = pathToRegexp.tokensToFunction(sources);
        this.createTarget = pathToRegexp.tokensToFunction(targets);

        // target params must be a subset of the source's params
        const names = ArrayHelper.intersect(this.sourceParamNames, this.targetParamNames);
        if (names.length !== this.targetParamNames.length) {
            throw new Error(`Invalid params: Source: ${this.source}: Target: ${this.target}`);
        }
        if (this.methods && !Array.isArray(this.methods)) {
            throw new Error(`Invalid methods: ${this.methods}`);
        }
    }

    resolve (url, method) {
        if (this.methods && !this.methods.includes(method)) {
            return null;
        }
        const result = this.sourceRegExp.exec(url);
        if (!result) {
            return null;
        }
        let params = this.getParams(result, this.sourceParamNames);
        if (this.defaults) {
            params = {...this.defaults, ...params};
        }
        return {path: this.createTarget(params), params};
    }

    createSourceUrl (data) {
        const result = this.targetRegExp.exec(data.path);
        if (!result) {
            return null;
        }
        let params = this.getParams(result, this.targetParamNames);
        try {
            // data.params = { id: 123, test: '456'};
            // data.anchor = 'anchor';
            let url = this.createSource(Object.assign(params, data.params));
            ObjectHelper.deleteProperties(this.sourceParamNames, params);
            params = UrlHelper.serialize(params);
            if (params) {
                url = `${url}?${params}`;
            }
            if (data.anchor !== undefined) {
                url = `${url}#${data.anchor}`;
            }
            return url;
        } catch {
            return null;
        }
    }

    getParams (result, names) {
        const params = {};
        for (let i = 0; i < names.length; ++i) {
            params[names[i]] = result[i + 1];
        }
        return params;
    }

    getParamNames (tokens) {
        const names = [];
        for (const token of tokens) {
            if (token.name && !names.includes(token.name)) {
                names.push(token.name);
            }
        }
        return names;
    }
};

const pathToRegexp = require('path-to-regexp');
const ArrayHelper = require('../helper/ArrayHelper');
const ObjectHelper = require('../helper/ObjectHelper');
const UrlHelper = require('../helper/UrlHelper');