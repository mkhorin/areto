/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Widget extends Base {

    constructor (config) {
        super({
            // disabled: true,
            // caching: true,
            cacheComponentId: 'cache',
            // cacheDuration: 60, // seconds
            ...config
        });
        this.controller = this.view.controller;
        this.module = this.controller.module;
        if (this.caching && !this.cache) {
            this.cache = this.module.get(this.cacheComponentId);
        }
    }

    getCacheKey () {
        return `widget-${this.module.NAME}-${this.id}`;
    }

    async run () {
        return 'Place widget content here';
    }

    async execute (renderParams) {
        this.content = '';
        this.renderParams = renderParams;
        if (this.disabled) {
            this.log('trace', `Widget disabled: ${this.id}`);
            return this.content;
        }
        this.log('trace', `Execute widget: ${this.id}`);
        return this.content = this.cache
            ? await this.cache.use(this.getCacheKey(), this.run.bind(this), this.cacheDuration)
            : await this.run();
    }

    renderTemplate (template, params) {
        return this.view.renderTemplate(this.view.get(template), {
            '_widget': this,
            ...this.renderParams, 
            ...params
        });
    }

    log (type, message, data) {
        CommonHelper.log(type, message, data, this.constructor.name, this.view);
    }
};

const CommonHelper = require('../helper/CommonHelper');