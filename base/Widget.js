'use strict';

const Base = require('./Base');

module.exports = class Widget extends Base {

    constructor (config) {
        super(Object.assign({
            module: config.view.controller.module,
            // disabled: true
            // caching: true                        
            cacheComponentId: 'cache'
            // cacheDuration: 60 // seconds
        }, config));
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
        this.module.log('trace', `${Widget.name}: execute: ${this.id}`);
        if (this.caching) {
            this.module.components[this.cacheComponentId].use(`widget-${this.id}`, this.run.bind(this), (err, content) => {
                this.content = content;
                cb(err);
            }, this.cacheDuration);
        } else {
            this.run((err, content)=> {
                this.content = content;
                cb(err);
            });
        }
    }

    render (template, cb, params) {
        this.view.controller.res.app.render(this.view.get(template), Object.assign({
            _widget: this
        }, this.renderParams, params), cb);
    }
};