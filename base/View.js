'use strict';

const Base = require('./Base');

module.exports = class View extends Base {

    static getConstants () {
        return {
            'ArrayHelper': require('../helpers/ArrayHelper'),
            'MiscHelper': require('../helpers/MiscHelper'),
            'StringHelper': require('../helpers/StringHelper'),
            'ObjectHelper': require('../helpers/ObjectHelper')
        };
    }

    constructor (config) {
        super(Object.assign({
            theme: config.controller.module.components.template.getTheme(),
            widgets: {},
            data: {} 
        }, config));
    }

    get (template) {
        return this.theme.get(template, this.controller.language);
    }

    getInner (template) {
        return this.get(this.controller.getTemplateName(template));
    }

    render (template, params, cb) {
        params = Object.assign({
            _view: this,
            _controller: this.controller,
            _format: this.controller.format.bind(this.controller),
            _t: this.controller.translate.bind(this.controller),
            _url: this.controller.createUrl.bind(this.controller),
            _baseUrl: this.controller.module.app.baseUrl
        }, params);
        this.layout = params.viewLayout || this.controller.VIEW_LAYOUT || this.controller.module.VIEW_LAYOUT;
        this.controller.res.app.render(this.get(template), params, (err, content)=> {
            err ? cb(err) : this.renderWidgets(content, params, cb);
        });
    }

    // CUSTOM DATA

    getData (key, defaults) {
        return Object.prototype.hasOwnProperty.call(this.data, key) ? this.data[key] : defaults;
    }

    setData (key, data) {
        this.data[key] = data;
    }

    // WIDGETS

    getWidgetAnchor (id) {
        return `{${id}-${this.controller.timestamp}}`;
    }

    createWidget (params) {
        let anchor = `${params.id}-${this.controller.timestamp}`;
        if (this.widgets[anchor]) {
            this.controller.log('error', `${View.name}: "${params.id}" widget already exists`);
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
                widget = ClassHelper.createInstance(Object.assign({
                    view: this
                }, widget, params));
                this.widgets[anchor] = widget;
                widget.execute(cb, renderParams);
            } else {
                this.controller.log('error', `${View.name}: "${params.configId}" widget config not found`);
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
module.exports.init();

const async = require('async');
const ClassHelper = require('../helpers/ClassHelper');