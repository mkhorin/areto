/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class ActionView extends Base {

    static getConstants () {
        return {
            POS_HEAD: 'head',
            POS_BODY_END: 'bodyEnd',

            'ArrayHelper': require('../helper/ArrayHelper'),
            'CommonHelper': require('../helper/CommonHelper'),
            'MongoHelper': require('../helper/MongoHelper'),
            'ObjectHelper': require('../helper/ObjectHelper'),
            'StringHelper': require('../helper/StringHelper')
        };
    }

    constructor (config) {
        super({
            'widgets': {},
            'data': {},
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
        let Class = this.getViewModelClass(name);
        config.view = this;
        config.module = this.module;
        return Class ? new Class(config) : null;
    }

    log (type, message, data) {
        CommonHelper.log(type, message, data, this.constructor.name, this.controller);
    }

    // RENDER

    async render (template, params) {
        params = this.getRenderParams(params);
        this.layout = params.viewLayout
            || this.controller.VIEW_LAYOUT
            || this.module.VIEW_LAYOUT;
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
            '_module': this.module,
            '_controller': this.controller,
            '_view': this,
            '_t': this.controller.translate.bind(this.controller),
            '_format': this.controller.format.bind(this.controller),
            '_url': this.controller.createUrl.bind(this.controller),
            '_baseUrl': this.module.app.baseUrl,
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
            let asset = this.module.get('asset');
            if (!asset) {
                return this.log('error', 'Not found asset component');
            }
            this._asset = asset.createViewAsset();
        }
        return this._asset;
    }

    // WIDGET

    anchorWidget (anchor, params) {
        if (!this.widgets.hasOwnProperty(anchor)) {
            this.widgets[anchor] = params || {};
        }
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

    renderWidget (anchor, params) {
        let widget = this.createWidget(anchor, this.widgets[anchor]);
        if (!widget) {
            return delete this.widgets[anchor];
        }
        this.widgets[anchor] = widget;
        return widget.execute(params);
    }

    createWidget (anchor, params) {
        let key = params && params.id || anchor;
        let widget = this.module.getConfig(`widgets.${key}`);
        if (!widget) {
            return this.log('error', `Widget config not found: ${key}`);
        }
        return ClassHelper.spawn({
            'module': this.module,
            'view': this,
            'id': anchor,
            ...widget,
            ...params
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

const ClassHelper = require('../helper/ClassHelper');
const CommonHelper = require('../helper/CommonHelper');
const PromiseHelper = require('../helper/PromiseHelper');
const DataMap = require('../base/DataMap');