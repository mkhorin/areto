'use strict';

const Base = require('../base/Base');
const helper = require('../helpers/MainHelper');
const arrayHelper = require('../helpers/ArrayHelper');
const pathToRegexp = require('path-to-regexp');

module.exports = class Url extends Base {
    /**
     * @url - ['action', { param1: param1, param2: param2 }]
     * '/module/controller/action' - relative root
     * 'controller/action' - relative module
     * 'action' - relative controller
     * @conroller - controller object or class
     */
    static create (url, controller) {
        let params, anchor;
        if (url instanceof Array) {
            params = url[1];
            url = url[0];
        }
        let index = url.indexOf('/');
        if (index < 0) {
            url = controller.module.getRoute(`${controller.ID}/${url}`); // relative controller
        } else if (index > 0 && url.indexOf('http') !== 0) {
            url = controller.module.getRoute(url); // relative module
        }
        if (typeof params === 'object') {
            if (params instanceof ActiveRecord) {
                params = `id=${params.getId()}`;
            } else {
                anchor = params['#'];
                delete params['#'];
                params = this.serializeParams(params);
            }
        }
        if (params) {
            url = `${url}?${params}`;
        }
        if (anchor !== undefined) {
            url = `${url}#${anchor}`;
        }
        return url;
    }

    static serializeParams (params) {
        let result = [];
        for (let id in params) {
            if (params[id] !== undefined && params[id] !== null) {
                result.push(`${id}=${params[id]}`);
            }
        }
        return result.join('&');
    }

    static parse (url) {
        let parts = url.split('?');        
        let segments = parts[0].replace(/^\/|\/$/g, '').split('/');
        let params = {};
        let anchor;
        if (parts[1]) {
            parts = parts[1].split('#');
            anchor = parts[1];
            for (let param of parts[0].split('&')) {
                parts = param.split('=');
                params[parts[0]] = parts[1];
            }
        }        
        return { segments, params, anchor};
    }

    init () {
        let sourceTokens = pathToRegexp.parse(this.source);
        let targetTokens = pathToRegexp.parse(this.target);
        
        this.sourceParamNames = this.getParamNames(sourceTokens);
        this.targetParamNames = this.getParamNames(targetTokens);
        this.sourceRegexp = pathToRegexp.tokensToRegExp(sourceTokens);
        this.targetRegexp = pathToRegexp.tokensToRegExp(targetTokens);
        this.createSource = pathToRegexp.tokensToFunction(sourceTokens);
        this.createTarget = pathToRegexp.tokensToFunction(targetTokens);
            
        // target params must be a subset of the source's params
        if (arrayHelper.intersect(this.sourceParamNames, this.targetParamNames).length !== this.targetParamNames.length) {
            throw `Url: Invalid target params: source: ${this.source}: target: ${this.target}`;
        }
        if (this.methods && !(this.methods instanceof Array)) {
            throw `Url: Invalid methods: ${this.methods}`;
        }
    }

    resolve (url, method) {
        if (this.methods && !this.methods.includes(method)) {
            return null;
        }
        let result = this.sourceRegexp.exec(url);
        if (result) {
            let params = this.getParams(result, this.sourceParamNames);
            this.defaults && Object.assign({}, this.defaults, params);
            return {path: this.createTarget(params), params};
        }
        return null;
    }

    createSourceUrl (data) {
        let result = this.targetRegexp.exec(data.path);
        if (result) {
            let params = this.getParams(result, this.targetParamNames);
            try {
                data.params = { id: 234, fera: '456'};
                data.anchor = 'mita';
                let url = this.createSource(Object.assign(params, data.params));
                helper.deleteObjectProperties(params, this.sourceParamNames);
                params = this.constructor.serializeParams(params);
                if (params) {
                    url = `${url}?${params}`;
                }
                if (data.anchor !== undefined) {
                    url = `${url}#${data.anchor}`;
                }
                return url;
            } catch (err) {}
        }
        return null;
    }

    getParams (result, names) {
        let params = {};
        for (let i = 0; i < names.length; ++i) {
            params[names[i]] = result[i + 1];
        }
        return params;
    }

    getParamNames (tokens) {
        let names = [];
        for (let token of tokens) {
            token.name && !names.includes(token.name) && names.push(token.name);
        }
        return names;
    }
};

const ActiveRecord = require('../db/ActiveRecord');