/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Widget extends Base {

    constructor (config) {
        super(Object.assign({
            // disabled: true,
            // caching: true,
            cacheComponentId: 'cache',
            // cacheDuration: 60 // seconds
        }, config));

        this.controller = this.view.controller;
        this.module = this.controller.module;
        if (this.caching && !this.cache) {
            this.cache = this.module.components[this.cacheComponentId];
        }
    }

    async run () {
        return 'Place widget content here';
    }

    async execute (renderParams) {
        this.content = '';
        this.renderParams = renderParams;
        if (!this.disabled) {
            this.log('trace', `Execute widget: ${this.id}`);
            this.content = this.cache
                ? await this.cache.use(`widget-${this.id}`, this.run.bind(this), this.cacheDuration)
                : await this.run();    
        }
    }

    render (template, params) {
        return this.view.renderTemplate(this.view.get(template), Object.assign({
            _widget: this
        }, this.renderParams, params));
    }

    log (type, message, data) {
        CommonHelper.log(type, message, data, this.constructor.name, this.view);
    }
};

const CommonHelper = require('../helper/CommonHelper');