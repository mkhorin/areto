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
    }

    init () {
        this.controller = this.view.controller;
        this.module = this.controller.module;
        if (this.caching && !this.cache) {
            this.cache = this.module.components[this.cacheComponentId];
        }
    }

    run (cb) {
        cb(null, 'Place widget content here');
    }

    execute (cb, renderParams) {
        this.content = '';
        this.renderParams = renderParams;
        if (this.disabled) {
            return cb();
        }
        this.log('trace', `Execute widget: ${this.id}`);
        if (this.cache) {
            return this.cache.use(`widget-${this.id}`, this.run.bind(this), (err, data)=> {
                this.content = data;
                cb(err);
            }, this.cacheDuration);
        }
        this.run((err, data)=> {
            this.content = data;
            cb(err);
        });
    }

    render (template, cb, params) {
        this.controller.res.app.render(this.view.get(template), Object.assign({
            _widget: this
        }, this.renderParams, params), cb);
    }

    log (type, message, data) {
        CommonHelper.log(type, message, data, this.constructor.name, this.view);
    }
};

const CommonHelper = require('../helper/CommonHelper');