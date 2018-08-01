'use strict';

const Base = require('../base/Base');

module.exports = class ActionView extends Base {

    static getConstants () {
        return {
            POS_HEAD: 'head',
            POS_BODY_END: 'bodyEnd',

            ArrayHelper: require('../helper/ArrayHelper'),
            CommonHelper: require('../helper/CommonHelper'),
            StringHelper: require('../helper/StringHelper'),
            ObjectHelper: require('../helper/ObjectHelper')
        };
    }

    constructor (config) {
        super(Object.assign({
            widgets: {},
            data: {} 
        }, config));
    }

    get (template) {
        return this.theme.getTemplate(template, this.controller.language);
    }

    getInnerTemplate (template) {
        return this.get(this.controller.getViewFileName(template));
    }

    getParentTemplate (template) {
        return this.theme.getParentTemplate(template, this.controller.language);
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
            (content, cb)=> cb(null, this._asset
                ? this._asset.render(content) : content)
        ], cb);
    }

    getRenderParams (params) {
        params = Object.assign({
            '_view': this,
            '_controller': this.controller,
            '_t': this.controller.translate.bind(this.controller),
            '_format': this.controller.format.bind(this.controller),
            '_url': this.controller.createUrl.bind(this.controller),
            '_baseUrl': this.controller.module.app.baseUrl,
            '_data': null
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
            let component = this.controller.module.getComponent('asset');  
            if (!component) {
                return this.log('error', 'Not found asset component');
            }
            this._asset = component.createViewAsset();
        }
        return this._asset;
    }

    // WIDGET

    createWidget (params) {
        let anchor = params.id;
        if (this.widgets[anchor]) {
            this.log('error', `Widget already exists: ${params.id}`);
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
            this.renderWidget(anchor, renderParams, cb);
        }, err => cb(err, err || this.insertWidgetContent(content)));
    }

    renderWidget (anchor, renderParams, cb) {
        let params = this.widgets[anchor];
        let widget = this.controller.module.widgets[params.configId];
        if (!widget) {
            delete this.widgets[anchor];
            this.log('error', `Widget config not found: ${params.configId}`);
            return cb();
        }
        widget = ClassHelper.createInstance(Object.assign({
            view: this
        }, widget, params));
        this.widgets[anchor] = widget;
        widget.execute(cb, renderParams);
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

    log (type, message, data) {
        CommonHelper.log(type, message, data, this.constructor.name, this.controller);
    }
};
module.exports.init();

const AsyncHelper = require('../helper/AsyncHelper');
const ClassHelper = require('../helper/ClassHelper');
const CommonHelper = require('../helper/CommonHelper');
const DataMap = require('../base/DataMap');