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
            EscapeHelper: require('../helper/EscapeHelper'),
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
        return this.get(this.controller.getViewFilename(name));
    }

    getParentTemplate (name) {
        return this.theme.getParentTemplate(name, this.controller.language);
    }

    getInternalParentTemplate (name) {
        return this.getParentTemplate(this.controller.getViewFilename(name));
    }

    getTemplateFromSameView (name) {
        return this.theme.getTemplateFromSameView(name, this.controller.language);
    }

    getTemplateFromOriginalOrSameView (name) {
        return this.theme.getTemplateFromOriginalOrSameView(name, this.controller.language);
    }

    getViewModelClass (name) {
        return this.theme.getModel(name, this.controller.language);
    }

    getModelFromSameView (name) {
        return this.theme.getModelFromSameView(name, this.controller.language);
    }

    getModelFromOriginalOrSameView (name) {
        return this.theme.getModelFromOriginalOrSameView(name, this.controller.language);
    }

    createViewModel (name, config = {}) {
        const Class = this.getViewModelClass(name);
        if (Class) {
            config.view = this;
            return new Class(config);
        }
    }

    log () {
        CommonHelper.log(this.controller, this.constructor.name, ...arguments);
    }

    // RENDER

    async render (template, params) {
        params = this.getRenderParams(params);
        let content = await this.renderTemplate(this.get(template) || template, params);
        content = await this.renderWidgets(content, params);
        return this._asset ? this._asset.render(content) : content;
    }

    renderTemplate (template, params) {
        const {app} = this.controller.res;
        return PromiseHelper.promise(app.render, app, template, params);
    }

    getRenderParams (params) {
        params = {
            _module: this.module,
            _controller: this.controller,
            _view: this,
            _layout: this.controller.VIEW_LAYOUT || this.module.defaultViewLayout,
            _baseUrl: this.module.app.baseUrl,
            _escape: this.EscapeHelper.escapeTags,
            _format: this.controller.format.bind(this.controller),
            _t: this.controller.translate.bind(this.controller),
            _url: this.controller.createUrl.bind(this.controller),
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
        if (this._asset !== undefined) {
            return this._asset;
        }
        const component = this.getAssetComponent();
        if (component) {
            this._asset = component.createViewAsset();
        } else {
            this._asset = null;
            this.log('error', 'Asset component not found');
        }
        return this._asset;
    }

    getAssetComponent () {
        return this.module.components.get('asset');
    }

    // WIDGET

    placeWidget (name, params) {
        if (!Object.hasOwn(this.widgets, name)) {
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
        return widget.resolveContent(params);
    }

    createWidget (id, params) {
        const key = params?.id || id;
        const config = this.getWidgetConfiguration(key);
        if (!config) {
            return this.log('error', `Widget configuration not found: ${key}`);
        }
        return ClassHelper.spawn({id, ...config, ...params, view: this});
    }

    getWidgetConfiguration (key) {
        if (!this._widgetConfigurationMap) {
            this._widgetConfigurationMap = this.module.getConfig('widgets') || {};
        }
        return this._widgetConfigurationMap.hasOwnProperty(key)
            ? this._widgetConfigurationMap[key]
            : null;
    }

    insertWidgetContent (content) {
        const names = Object.keys(this.widgets);
        if (!names.length) {
            return content;
        }
        const regex = new RegExp(`#{(${names.join('|')})}`, 'g');
        return content.replace(regex, (match, name) => this.widgets[name].content);
    }
};
module.exports.init();

const ClassHelper = require('../helper/ClassHelper');
const CommonHelper = require('../helper/CommonHelper');
const PromiseHelper = require('../helper/PromiseHelper');
const DataMap = require('../base/DataMap');