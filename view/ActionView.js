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

    getInternalTemplate (name) {
        return this.get(this.controller.getViewFileName(name));
    }

    getParentTemplate (name) {
        return this.theme.getParentTemplate(name, this.controller.language);
    }

    getViewOwnTemplate (name) {
        return this.theme.getViewOwnTemplate(name, this.controller.language);
    }

    getViewOwnTemplateWithOrigin (name) {
        return this.theme.getViewOwnTemplateWithOrigin(name, this.controller.language);
    }

    getViewModelClass (name) {
        return this.theme.getModel(name, this.controller.language);
    }

    createViewModel (name, config = {}) {
        const Class = this.getViewModelClass(name);
        config.view = this;
        return Class ? new Class(config) : null;
    }

    log () {
        CommonHelper.log(this.controller, this.constructor.name, ...arguments);
    }

    // RENDER

    async render (template, params) {
        params = this.getRenderParams(params);
        let content = await this.renderTemplate(this.get(template), params);
        content = await this.renderWidgets(content, params);
        return this._asset ? this._asset.render(content) : content;
    }

    renderTemplate (template, params) {
        const app = this.controller.res.app;
        return PromiseHelper.promise(app.render.bind(app, template, params));
    }

    getRenderParams (params) {
        params = {
            _module: this.module,
            _controller: this.controller,
            _view: this,
            _layout: this.controller.VIEW_LAYOUT || this.module.VIEW_LAYOUT,
            _t: this.controller.translate.bind(this.controller),
            _format: this.controller.format.bind(this.controller),
            _url: this.controller.createUrl.bind(this.controller),
            _baseUrl: this.module.app.baseUrl,
            _data: null,
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
            const asset = this.module.get('asset');
            if (!asset) {
                return this.log('error', 'Asset component not found');
            }
            this._asset = asset.createViewAsset();
        }
        return this._asset;
    }

    // WIDGET

    placeWidget (name, params) {
        if (!this.widgets.hasOwnProperty(name)) {
            this.widgets[name] = params || {};
        }
        return `#{${name}}`;
    }

    async renderWidgets (content, renderParams) {
        const names = Object.keys(this.widgets);
        if (names.length === 0) {
            return content;
        }
        for (const name of names) {
            await this.renderWidget(name, renderParams);
        }
        return this.insertWidgetContent(content);
    }

    renderWidget (name, params) {
        const widget = this.createWidget(name, this.widgets[name]);
        if (!widget) {
            return delete this.widgets[name];
        }
        this.widgets[name] = widget;
        return widget.execute(params);
    }

    createWidget (id, params) {
        const key = params && params.id || id;
        const config = this.getWidgetConfig(key);
        if (!config) {
            return this.log('error', `Widget configuration not found: ${key}`);
        }
        return ClassHelper.spawn({id, ...config, ...params, view: this});
    }

    getWidgetConfig (key) {
        if (!this._widgetConfigMap) {
            this._widgetConfigMap = this.module.getConfig('widgets') || {};
        }
        return this._widgetConfigMap.hasOwnProperty(key) ? this._widgetConfigMap[key] : null;
    }

    insertWidgetContent (content) {
        const names = Object.keys(this.widgets).join('|');
        return names.length
            ? content.replace(new RegExp(`#{(${names})}`, 'g'), (match, name)=> this.widgets[name].content)
            : content;
    }
};
module.exports.init();

const ClassHelper = require('../helper/ClassHelper');
const CommonHelper = require('../helper/CommonHelper');
const PromiseHelper = require('../helper/PromiseHelper');
const DataMap = require('../base/DataMap');