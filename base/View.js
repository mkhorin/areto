'use strict';

const Base = require('./Base');
const helper = require('../helpers/MainHelper');
const async = require('async');

module.exports = class View extends Base {

    constructor (controller, config) {
        super(Object.assign({
            controller,
            theme: controller.module.components.template.getTheme(),
            widgets: {}
        }, config));
        this._buffer = {};
    }

    get (template) {
        return this.theme.get(template);
    }

    render (template, params, cb) {
        params = Object.assign({
            controller: this.controller,
            view: this,
            t: this.controller.translate.bind(this.controller),
            u: this.controller.createUrl.bind(this.controller)
        }, params);
        this.controller.res.app.render(this.theme.get(template), params, (err, content)=> {
            err ? cb(err) : this.renderWidgets(content, params, cb);
        });
    }

    getData (key, defaults) {
        return Object.prototype.hasOwnProperty.call(this._buffer, key) ? this._buffer[key] : defaults;
    }

    setData (key, data) {
        this._buffer[key] = data;
    }

    // WIDGETS

    anchorWidget (name) {
        return `{${name}-${this.controller.timestamp}}`;
    }

    createWidget (name, params) {
        name = `${name}-${this.controller.timestamp}`;
        this.widgets[name] = params;
        return `{${name}}`;
    }

    renderWidgets (content, renderParams, cb) {
        let names = Object.keys(this.widgets);
        if (names.length > 0) {
            async.each(names, (name, cb)=> {
                let params = this.widgets[name];
                let widget = this.controller.module.widgets[params.id];
                if (widget) {
                    widget = helper.createInstance(Object.assign({view: this}, widget, params));
                    this.widgets[name] = widget;
                    widget.execute(cb, renderParams);
                } else {
                    this.controller.module.log('error', `View: "${params.id}" widget not found`);
                    delete this.widgets[name];
                    cb();
                }
            }, err => {
                err ? cb(err) : cb(null, this.prepareWidgetContent(content));
            });
        } else cb(null, content);
    }

    prepareWidgetContent (content) {
        let names = Object.keys(this.widgets).join('|');
        if (names.length) {
            return content.replace(new RegExp(`{(${names})}`, 'g'), (match, name)=> this.widgets[name].content);
        }
        return content;
    }
};