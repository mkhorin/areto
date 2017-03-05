'use strict';

const Base = require('./Base');
const MainHelper = require('../helpers/MainHelper');
const async = require('async');

module.exports = class View extends Base {

    constructor (controller, config) {
        super(Object.assign({
            controller,
            theme: controller.module.components.template.getTheme(),
            widgets: {},
            data: {}
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

    getWidgetAnchor (id) {
        return `{${id}-${this.controller.timestamp}}`;
    }

    createWidget (params) {
        let anchor = `${params.id}-${this.controller.timestamp}`;
        if (this.widgets[anchor]) {
            this.controller.module.log('error', `View: "${params.id}" widget already exists`);
            return '';
        }
        if (!params.configId) {
            params.configId = params.id;
        }
        this.widgets[anchor] = params;
        return `{${anchor}}`;
    }

    renderWidgets (content, renderParams, cb) {
        let anchors = Object.keys(this.widgets);
        if (anchors.length === 0) {
            return cb(null, content);
        }
        async.each(anchors, (anchor, cb)=> {
            let params = this.widgets[anchor];
            let widget = this.controller.module.widgets[params.configId];
            if (widget) {
                widget = MainHelper.createInstance(Object.assign({view: this}, widget, params));
                this.widgets[anchor] = widget;
                widget.execute(cb, renderParams);
            } else {
                this.controller.module.log('error', `View: "${params.configId}" widget config not found`);
                delete this.widgets[anchor];
                cb();
            }
        }, err => {
            err ? cb(err) : cb(null, this.prepareWidgetContent(content));
        });
    }

    prepareWidgetContent (content) {
        let anchors = Object.keys(this.widgets).join('|');
        if (anchors.length) {
            return content.replace(new RegExp(`{(${anchors})}`, 'g'), (match, anchor)=> this.widgets[anchor].content);
        }
        return content;
    }
};