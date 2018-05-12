'use strict';

const Base = require('./Base');

module.exports = class Widget extends Base {

    constructor (config) {
        super(Object.assign({
            controller: config.view.controller,
            module: config.view.controller.module,
            // disabled: true,
            // caching: true,
            cacheComponentId: 'cache',
            // cacheDuration: 60 // seconds
        }, config));
    }

    init () {
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
        this.view.log('trace', `${Widget.name}: execute: ${this.id}`);
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
};