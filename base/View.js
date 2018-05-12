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
        params = this.getRenderParams(params);
        this.layout = params.viewLayout
            || this.controller.VIEW_LAYOUT
            || this.controller.module.VIEW_LAYOUT;
        AsyncHelper.waterfall([
            cb => this.controller.res.app.render(this.get(template), params, cb),
            (content, cb)=> this.renderWidgets(content, params, cb),
            (content, cb)=> cb(null, this._asset ? this._asset.render(content) : content)
        ], cb);
    }

    getRenderParams (params) {
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
        return params;
    }

    createHead () {
        return this.createAssetPosition(this.POS_HEAD);
    }

    createBodyEnd () {
        return this.createAssetPosition(this.POS_BODY_END);
    }

    // ASSET

    addAsset (data) {
        if (this.getAsset()) {
            this._asset.add(data);
        }
    }

    createAssetPosition (pos) {
        return this.getAsset() ? this._asset.createPosition(pos) : '';
    }

    getAsset () {
        if (this._asset === undefined) {
            if (!this.controller.module.components.asset) {
                return this.log('error', 'Not found asset component');
            }
            this._asset = this.controller.module.components.asset.createViewAsset();
        }
        return this._asset;
    }

    // WIDGET

    createWidget (params) {
        let anchor = params.id;
        if (this.widgets[anchor]) {
            this.log('error', `${View.name}: widget already exists: ${params.id}`);
            return '';
        }
        if (!params.configId) {
            params.configId = params.id;
        }
        this.widgets[anchor] = params;
        return `#{${anchor}}`;
    }

    renderWidgets (content, renderParams, cb) {
        let anchors = Object.keys(this.widgets);
        if (anchors.length === 0) {
            return cb(null, content);
        }
        AsyncHelper.eachSeries(anchors, (anchor, cb)=> {
            let params = this.widgets[anchor];
            let widget = this.controller.module.widgets[params.configId];
            if (!widget) {
                delete this.widgets[anchor];
                this.log('error', `${View.name}: widget config not found: ${params.configId}`);
                return cb();
            }
            widget = ClassHelper.createInstance(Object.assign({
                view: this
            }, widget, params));
            this.widgets[anchor] = widget;
            widget.execute(cb, renderParams);
        }, err => {
            err ? cb(err)
                : cb(null, this.insertWidgetContent(content));
        });
    }

    insertWidgetContent (content) {
        let anchors = Object.keys(this.widgets).join('|');
        if (anchors.length === 0) {
            return content;
        }
        return content.replace(new RegExp(`#{(${anchors})}`, 'g'), (match, anchor)=> {
            return this.widgets[anchor].content;
        });
    }
};
module.exports.init();

const AsyncHelper = require('../helpers/AsyncHelper');
const ClassHelper = require('../helpers/ClassHelper');
const DataMap = require('../data/DataMap');