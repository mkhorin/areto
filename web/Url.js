/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Url extends Base {
    /**
     * @url - ['action', { param1: param1, param2: param2 }]
     * '/module/controller/action' - relative app
     * 'controller/action' - relative module
     * 'action' - relative controller     
     */
    static create (url, module, controller) {
        let params, anchor;
        if (url instanceof Array) {
            params = url[1];
            url = url[0];
        }
        let index = url.indexOf('/');
        if (index === -1) { // relative controller
            url = module.getRoute(controller ? `${controller.NAME}/${url}` : url);
        } else if (index === 0) { // relative app
            if (module.app.mountPath !== '/') {
                if (url.substring(0, module.app.mountPath.length) !== module.app.mountPath) {
                    url = module.app.mountPath + url;
                }
            }
        } else if (url.substring(0, 4) !== 'http') { // relative module
            url = module.getRoute(url);
        }
        if (params instanceof ActiveRecord) {
            params = `id=${params.getId()}`;
        } else if (typeof params === 'object' && params) {
            anchor = params['#'];
            delete params['#'];
            params = this.serializeParams(params);
        }
        if (params) {
            url = url +'?'+ params;
        }
        if (anchor !== undefined) {
            url = url +'#'+ anchor;
        }
        return url;
    }

    static serializeParams (params) {
        if (!params) {
            return '';
        }
        let result = [];
        for (let key of Object.keys(params)) {
            if (params[key] !== undefined && params[key] !== null) {
                result.push(key +'='+ params[key]);
            }
        }
        return result.join('&');
    }

    static parse (url) {
        let parts = url.split('?');        
        let segments = parts[0].replace(/^\/|\/$/g, '').split('/');
        let params = {}, anchor;
        if (parts[1]) {
            parts = parts[1].split('#');
            anchor = parts[1];
            for (let param of parts[0].split('&')) {
                parts = param.split('=');
                params[parts[0]] = parts[1];
            }
        }        
        return {segments, params, anchor};
    }

    constructor (config) {
        super(config);

        let sources = pathToRegexp.parse(this.source);
        let targets = pathToRegexp.parse(this.target);
        
        this.sourceParamNames = this.getParamNames(sources);
        this.targetParamNames = this.getParamNames(targets);

        this.sourceRegexp = pathToRegexp.tokensToRegExp(sources);
        this.targetRegexp = pathToRegexp.tokensToRegExp(targets);
        this.createSource = pathToRegexp.tokensToFunction(sources);
        this.createTarget = pathToRegexp.tokensToFunction(targets);
            
        // target params must be a subset of the source's params
        let names = ArrayHelper.intersect(this.sourceParamNames, this.targetParamNames);
        if (names.length !== this.targetParamNames.length) {
            throw new Error(this.wrapClassMessage(`Invalid params: Source: ${this.source}: Target: ${this.target}`));
        }
        if (this.methods && !(this.methods instanceof Array)) {
            throw new Error(this.wrapClassMessage(`Invalid methods: ${this.methods}`));
        }
    }

    resolve (url, method) {
        if (this.methods && !this.methods.includes(method)) {
            return null;
        }
        let result = this.sourceRegexp.exec(url);
        if (!result) {
            return null;
        }
        let params = this.getParams(result, this.sourceParamNames);
        if (this.defaults) {
            params = Object.assign({}, this.defaults, params);
        }
        return {
            path: this.createTarget(params),
            params
        };
    }

    createSourceUrl (data) {
        let result = this.targetRegexp.exec(data.path);
        if (!result) {
            return null;
        }
        let params = this.getParams(result, this.targetParamNames);
        try {
            // data.params = { id: 123, test: '456'};
            // data.anchor = 'anchor';
            let url = this.createSource(Object.assign(params, data.params));
            ObjectHelper.deleteProps(this.sourceParamNames, params);
            params = this.constructor.serializeParams(params);
            if (params) {
                url = `${url}?${params}`;
            }
            if (data.anchor !== undefined) {
                url = `${url}#${data.anchor}`;
            }
            return url;
        } catch (err) {
            return null;
        }
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
            if (token.name && !names.includes(token.name)) {
                names.push(token.name);
            }
        }
        return names;
    }
};

const pathToRegexp = require('path-to-regexp');
const ActiveRecord = require('../db/ActiveRecord');
const ArrayHelper = require('../helper/ArrayHelper');
const ObjectHelper = require('../helper/ObjectHelper');