'use strict';

const Base = require('./Base');

module.exports = class View extends Base {

    static getConstants () {
        return {
            POS_HEAD: 'head',
            POS_BODY_END: 'bodyEnd',

            ArrayHelper: require('../helpers/ArrayHelper'),
            CommonHelper: require('../helpers/CommonHelper'),
            StringHelper: require('../helpers/StringHelper'),
            ObjectHelper: require('../helpers/ObjectHelper')
        };
    }

    constructor (config) {
        super(Object.assign({
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

    getParent (template) {
        return this.theme.getParent(template, this.controller.language);
    }

    log () {
        return this.controller.log.apply(this.controller, arguments);
    }

    // RENDER

    render (template, params, cb) {
        params = Object.assign({
            _data: null,
            _view: this,
            _controller: this.controller,
            _format: this.controller.format.bind(this.controller),
            _t: this.controller.translate.bind(this.controller),
            _url: this.controller.createUrl.bind(this.controller),
            _baseUrl: this.controller.module.app.baseUrl
        }, params);
        params._data = new DataMap(params._data);
        this.layout = params.viewLayout
            || this.controller.VIEW_LAYOUT
            || this.controller.module.VIEW_LAYOUT;
        this.controller.res.app.render(this.get(template), params, (err, content)=> {
            err ? cb(err)
                : this.renderWidgets(content, params, cb);
        });
    }

    renderHead () {
        return this.renderAsset(this.POS_HEAD);
    }

    renderBodyEnd () {
        return this.renderAsset(this.POS_BODY_END);
    }

    // ASSET

    addAsset (data) {
        let asset = this.getAsset();
        if (asset) {
            asset.add(data);
        }
    }

    renderAsset (position) {
        let asset = this.getAsset();
        return asset ? asset.render(position) : '';
    }

    getAsset () {
        if (this._asset === undefined) {
            if (!this.controller.module.components.asset) {
                return this.log('error', 'Not found asset manager');
            }
            this._asset = this.controller.module.components.asset.createViewAsset();
        }
        return this._asset;
    }

    // WIDGET

    getWidgetAnchor (id) {
        return `{${id}-${this.controller.timestamp}}`;
    }

    createWidget (params) {
        let anchor = `${params.id}-${this.controller.timestamp}`;
        if (this.widgets[anchor]) {
            this.log('error', `${View.name}: widget already exists: ${params.id}`);
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
        AsyncHelper.eachSeries(anchors, (anchor, cb)=> {
            let params = this.widgets[anchor];
            let widget = this.controller.module.widgets[params.configId];
            if (widget) {
                widget = ClassHelper.createInstance(Object.assign({
                    view: this
                }, widget, params));
                this.widgets[anchor] = widget;
                widget.execute(cb, renderParams);
            } else {
                this.log('error', `${View.name}: widget config not found: ${params.configId}`);
                delete this.widgets[anchor];
                cb();
            }
        }, err => {
            err ? cb(err)
                : cb(null, this.prepareWidgetContent(content));
        });
    }

    prepareWidgetContent (content) {
        let anchors = Object.keys(this.widgets).join('|');
        if (anchors.length === 0) {
            return content;
        }
        return content.replace(new RegExp(`{(${anchors})}`, 'g'), (match, anchor)=> {
            return this.widgets[anchor].content;
        });
    }
};
module.exports.init();

const AsyncHelper = require('../helpers/AsyncHelper');
const ClassHelper = require('../helpers/ClassHelper');
const DataMap = require('../data/DataMap');