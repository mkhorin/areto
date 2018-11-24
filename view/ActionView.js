/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class ActionView extends Base {

    static getConstants () {
        return {
            POS_HEAD: 'head',
            POS_BODY_END: 'bodyEnd',

            ArrayHelper: require('../helper/ArrayHelper'),
            CommonHelper: require('../helper/CommonHelper'),
            MongoHelper: require('../helper/MongoHelper'),
            ObjectHelper: require('../helper/ObjectHelper'),
            StringHelper: require('../helper/StringHelper')
        };
    }

    constructor (config) {
        super({
            widgets: {},
            data: {},
            ...config
        });
    }

    get (name) {
        return this.theme.getTemplate(name, this.controller.language);
    }

    getInnerTemplate (name) {
        return this.get(this.controller.getViewFileName(name));
    }

    getParentTemplate (name) {
        return this.theme.getParentTemplate(name, this.controller.language);
    }

    getViewModelClass (name) {
        return this.theme.getModel(name, this.controller.language);
    }

    createViewModel (name, config = {}) {
        config.view = this;
        let Class = this.getViewModelClass(name);
        return Class ? new Class(config) : null;
    }

    // RENDER

    async render (template, params) {
        params = this.getRenderParams(params);
        this.layout = params.viewLayout
            || this.controller.VIEW_LAYOUT
            || this.controller.module.VIEW_LAYOUT;
        let content = await this.renderTemplate(this.get(template), params);
        content = await this.renderWidgets(content, params);
        return this._asset ? this._asset.render(content) : content;
    }

    renderTemplate (template, params) {
        let app = this.controller.res.app;
        return PromiseHelper.promise(app.render.bind(app, template, params));
    }

    getRenderParams (params) {
        params = {
            '_view': this,
            '_controller': this.controller,
            '_t': this.controller.translate.bind(this.controller),
            '_format': this.controller.format.bind(this.controller),
            '_url': this.controller.createUrl.bind(this.controller),
            '_baseUrl': this.controller.module.app.baseUrl,
            '_data': null,
            ...params
        };
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

    async renderWidgets (content, renderParams) {
        let anchors = Object.keys(this.widgets);
        if (anchors.length === 0) {
            return content;
        }
        for (let anchor of anchors) {
            await this.renderWidget(anchor, renderParams);
        }
        return this.insertWidgetContent(content);
    }

    renderWidget (anchor, renderParams) {
        let params = this.widgets[anchor];
        let widget = this.controller.module.widgets[params.configId];
        if (!widget) {
            delete this.widgets[anchor];
            this.log('error', `Widget config not found: ${params.configId}`);
            return Promise.resolve();
        }
        widget = ClassHelper.createInstance({
            'view': this,
            ...widget,
            ...params
        });
        this.widgets[anchor] = widget;
        return widget.execute(renderParams);
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

const ClassHelper = require('../helper/ClassHelper');
const CommonHelper = require('../helper/CommonHelper');
const PromiseHelper = require('../helper/PromiseHelper');
const DataMap = require('../base/DataMap');