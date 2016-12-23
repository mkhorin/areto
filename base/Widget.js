'use strict';

const Base = require('./Base');

// this.cacheDuration
// this.cacheComponentId

module.exports = class Widget extends Base {

    static getConstants () {
        return {
            ID: this.getId()
        };
    }

    static getId () {        
        return this.name.toLowerCaseFirstLetter();
    }

    constructor (config) {
        super(Object.assign({
            // caching: true
            // disabled: true
            cacheComponentId: 'cache'
        }, config));
    }

    run (cb) {
        cb(null, 'Run here');
    }

    execute (cb, renderParams) {
        this.content = '';
        this.renderParams = renderParams;
        if (this.disabled) {
            return cb();
        }
        this.module.log('trace', `Widget: execute: ${this.ID}`);        
        if (this.caching) {
            this.module.components[this.cacheComponentId].use(this.ID, this.run.bind(this), (err, content) => {
                if (err) {
                    return cb(err);
                }
                this.content = content;
                cb();
            }, this.cacheDuration);
        } else {
            this.run((err, content)=> {
                if (err) {
                    return cb(err);
                }
                this.content = content;
                cb();
            });
        }
    }

    render (template, cb, params) {
        this.view.controller.res.app.render(this.view.get(template), Object.assign({
            widget: this
        }, params), cb);
    }
};