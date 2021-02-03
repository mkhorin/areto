/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Widget extends Base {

    constructor (config) {
        super({
            // disabled: false,
            // caching: false,
            // cacheDuration: 100, // seconds
            cacheComponentId: 'cache',
            ...config
        });
        this.module = this.view.module;
        this.controller = this.view.controller;
        if (this.caching && !this.cache) {
            this.cache = this.module.get(this.cacheComponentId);
        }
    }

    execute () {
        return 'Place widget content here';
    }

    renderTemplate (template, params) {
        return this.view.renderTemplate(this.view.get(template), {
            _widget: this,
            ...this.renderParams,
            ...params
        });
    }

    async resolveContent (renderParams) {
        this.content = '';
        this.renderParams = renderParams;
        if (this.disabled) {
            this.log('trace', `Widget disabled: ${this.id}`);
            return this.content;
        }
        this.log('trace', `Execute widget: ${this.id}`);
        this.content = this.cache
            ? await this.cache.use(this.getCacheKey(), this.execute.bind(this), this.cacheDuration)
            : await this.execute();
        return this.content;
    }

    getCacheKey () {
        return `widget-${this.module.getInternalName()}-${this.id}`;
    }

    log () {
        CommonHelper.log(this.view, this.constructor.name, ...arguments);
    }
};

const CommonHelper = require('../helper/CommonHelper');