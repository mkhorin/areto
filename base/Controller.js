/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Component');

module.exports = class Controller extends Base {

    static getExtendedClassProperties () {
        return [
            'METHODS',
            'ACTIONS'
        ];
    }

    static getConstants () {
        return {
            // declare allowed methods for action if not set then all
            METHODS: {
                // 'logout': 'post'
            },
            // declare external actions for the controller
            ACTIONS: {
                // 'captcha': { Class: require('areto/security/captcha/CaptchaAction'), ... }
            },
            EVENT_BEFORE_ACTION: 'beforeAction',
            EVENT_AFTER_ACTION: 'afterAction',
            DEFAULT_ACTION: 'index',
            CONTROLLER_DIRECTORY: 'controller',
            MODEL_DIRECTORY: 'model',
            // inherited from module by default
            // ACTION_VIEW: require('./ActionView'),
            // VIEW_LAYOUT: 'default',
            // INLINE_ACTION: require('./InlineAction')
        };
    }

    static getBaseName () {
        if (!this.hasOwnProperty('_baseName')) {
            const name = StringHelper.trimEnd(this.name, 'Controller');
            this._baseName = StringHelper.toLowerCaseFirstLetter(name);
        }
        return this._baseName;
    }

    static getRouteName () {
        if (!this.hasOwnProperty('_routeName')) {
            this._routeName = StringHelper.camelToKebab(this.getBaseName());
        }
        return this._routeName;
    }

    static getActionNames () {
        const names = Object.keys(this.ACTIONS);
        for (let name of ObjectHelper.getAllFunctionNames(this.prototype)) {
            if (name.indexOf('action') === 0) {
                name = StringHelper.toLowerCaseFirstLetter(name.substring(6));
                names.push(name);
            }
        }
        return names;
    }

    static getModelClass () {
        if (!this.hasOwnProperty('_MODEL_CLASS')) {
            const closest = FileHelper.getClosestDirectory(this.CONTROLLER_DIRECTORY, this.CLASS_DIRECTORY);
            const nested = this.getNestedDirectory();
            const className = this.getModelClassName();
            const dir = path.join(this.MODEL_DIRECTORY, nested, className);
            this._MODEL_CLASS = require(path.join(path.dirname(closest), dir));
        }
        return this._MODEL_CLASS;
    }

    static getModelClassName () {
        return StringHelper.trimEnd(this.name, 'Controller');
    }

    static getViewDirectory () {
        if (!this.hasOwnProperty('_VIEW_DIRECTORY')) {
            const nested = this.getNestedDirectory();
            this._VIEW_DIRECTORY = nested
                ? `${nested}/${this.getBaseName()}/`
                : `${this.getBaseName()}/`;
        }
        return this._VIEW_DIRECTORY;
    }

    static getNestedDirectory () {
        if (!this.hasOwnProperty('_NESTED_DIRECTORY')) {
            this._NESTED_DIRECTORY = FileHelper.getRelativePathByDirectory(this.CONTROLLER_DIRECTORY, this.CLASS_DIRECTORY);
        }
        return this._NESTED_DIRECTORY;
    }

    constructor (config) {
        super(config);
        this.i18n = this.getI18n();
        this.language = this.getLanguage();
        this.response = new Response;
        this.response.controller = this;
        this.timestamp = Date.now();
    }

    createModel (params) {
        return this.spawn(this.getModelClass(), params);
    }

    getBaseName () {
        return this.constructor.getBaseName();
    }

    getFullName () {
        return `${this.module.getFullName()}.${this.getBaseName()}`;
    }

    getRouteName () {
        return this.constructor.getRouteName();
    }

    getModelClass () {
        return this.constructor.getModelClass();
    }

    assignSource (controller) {
        this.module = controller.module;
        this.req = controller.req;
        this.res = controller.res;
        this.err = controller.err;
        this.user = controller.user;
        this.language = controller.language;
        this.timestamp = controller.timestamp;
        return this;
    }

    async execute (name) {
        this.action = this.createAction(name);
        if (!this.action) {
            throw new Error(`Unable to create action: ${name}`);
        }
        const modules = this.module.getRouteModules();
        // trigger module's beforeAction from root to current
        for (let i = modules.length - 1; i >= 0; --i) {
            await modules[i].beforeAction(this.action);
        }
        await this.beforeAction();
        if (!this.response.has()) {
            await this.action.execute();
        }
        await this.afterAction();
        // trigger module's afterAction from current to root
        for (const module of modules) {
            await module.afterAction(this.action);
        }
        this.response.end();
    }

    spawn (config, params) {
        return ClassHelper.spawn(config, {
            module: this.module,
            user: this.user,
            ...params
        });
    }

    // ACTION

    createAction (name) {
        name = name || this.DEFAULT_ACTION;
        return this.createInlineAction(name) || this.createMappedAction(name);
    }

    createInlineAction (name) {
        const method = this[`action${StringHelper.capitalize(name)}`];
        if (typeof method === 'function') {
            return this.spawn(this.INLINE_ACTION || this.module.InlineAction, {
                controller: this,
                method,
                name
            });
        }
    }

    createMappedAction (name) {
        if (Object.prototype.hasOwnProperty.call(this.ACTIONS, name)) {
            return this.spawn(this.ACTIONS[name], {
                controller: this,
                name
            });
        }
    }

    // EVENTS

    beforeAction () {
        // call await super.beforeAction() if override it
        const event = new ActionEvent(this.action);
        return this.trigger(this.EVENT_BEFORE_ACTION, event);
    }

    afterAction () {
        // call await super.afterAction() if override it
        const event = new ActionEvent(this.action);
        return this.trigger(this.EVENT_AFTER_ACTION, event);
    }

    // REQUEST

    isAjax () {
        return this.req.xhr;
    }

    isGetRequest () {
        return this.req.method === 'GET';
    }

    isPostRequest () {
        return this.req.method === 'POST';
    }

    getHttpHeader (name) {
        return this.req.get(name);
    }

    getCurrentRoute () {
        return this.req.baseUrl + this.req.path;
    }

    getQueryParam (key, defaults) {
        return ObjectHelper.getValue(key, this.req.query, defaults);
    }

    getQueryParams () {
        return this.req.query;
    }

    getPostParam (key, defaults) {
        return ObjectHelper.getValue(key, this.req.body, defaults);
    }

    getPostParams () {
        return this.req.body;
    }

    // FLASH MESSAGES

    setFlash (key, message, params) {
        typeof this.req.flash === 'function'
            ? this.req.flash(key, this.translate(message, params))
            : this.log('error', 'Session flash not found', message);
    }

    getFlash (key) {
        return typeof this.req.flash === 'function'
            ? this.req.flash(key)
            : null;
    }

    // RESPONSE

    goHome () {
        this.redirect(this.module.getHomeUrl());
    }

    goLogin () {
        this.redirect(this.user.getLoginUrl());
    }

    goBack (url) {
        this.redirect(this.user.getReturnUrl(url));
    }

    reload () {
        this.setHttpStatus(Response.OK);
        this.response.redirect(this.req.originalUrl);
    }

    redirect (url) {
        this.response.redirect(this.createUrl(url));
    }

    setHttpStatus (code) {
        this.response.code = code;
        return this;
    }

    setHttpHeader () {
        this.res.set(...arguments);
        return this;
    }

    // RENDER

    async render () {
        this.send(await this.renderOnly(...arguments));
    }

    renderOnly (template, data) {
        const model = this.createViewModel(template, {data});
        return model
            ? this.renderViewModel(model, template)
            : this.renderTemplate(template, data);
    }

    async renderViewModel (model, template) {
        const data = await model.getTemplateData();
        return this.renderTemplate(template, data);
    }

    async renderTemplate (template, data) {
        const file = this.getViewFilename(template);
        return this.getView().render(file, data);
    }

    createViewModel (name, config = {}) {
        const file = this.getViewFilename(name);
        return this.getView().createViewModel(file, config);
    }

    getView () {
        if (!this._view) {
            this._view = this.createView();
        }
        return this._view;
    }

    createView (params) {
        return this.spawn(this.ACTION_VIEW || this.module.ActionView, {
            controller: this,
            theme: this.getTheme(),
            ...params
        });
    }

    getTheme () {
        return this.module.components
            .get(this.module.defaultViewComponentId)
            .getTheme();
    }

    getViewFilename (name) {
        if (typeof name !== 'string') {
            name = String(name);
        }
        return !path.isAbsolute(name)
            ? this.constructor.getViewDirectory() + name
            : name;
    }

    // SEND

    send (data, code) {
        this.response.send('send', data, code);
    }

    sendText (data, code) {
        this.send(typeof data === 'string' ? data : String(data), code);
    }

    sendFile (data, code) {
        this.response.send('sendFile', data, code);
    }

    sendJson (data, code) {
        this.response.send('json', data, code);
    }

    sendStatus (code) {
        this.response.send('sendStatus', code);
    }

    sendData (data, encoding) {
        this.response.sendData(data, encoding);
    }

    // URL

    getOriginalUrl () {
        return this.req.originalUrl;
    }

    getUrlManager () {
        return this.module.components.get(this.module.defaultUrlManagerComponentId);
    }

    createUrl (...data) {
        if (this._urlManager === undefined) {
            this._urlManager = this.getUrlManager();
        }
        if (data.length === 1) {
            data = data[0];
        }
        return this._urlManager.resolve(data, this.getRouteName());
    }

    getHostUrl () {
        return this.req.protocol +'://'+ this.req.get('host');
    }

    // SECURITY

    getCsrfToken () {
        return this.user.getCsrfToken();
    }

    async can (name, params) {
        if (!await this.user.can(name, params)) {
            throw new Forbidden;
        }
    }

    // I18N

    getFormatter () {
        return this.module.components.get(this.module.defaultFormatterComponentId);
    }

    getI18n () {
        return this.module.components.get(this.module.defaultI18nComponentId);
    }

    getLanguage () {
        return this.language || this.i18n?.language;
    }

    translate (message, params, source = 'app') {
        if (Array.isArray(message)) {
            return this.translate(...message);
        }
        if (typeof message?.translate === 'function') {
            return message.translate(this.i18n, this.language);
        }
        return source
            ? this.i18n.translate(message, params, source, this.language)
            : this.i18n.format(message, params, this.language);
    }

    translateMessageMap (data, ...args) {
        data = {...data};
        for (const key of Object.keys(data)) {
            data[key] = this.translate(data[key], ...args);
        }
        return data;
    }

    format (value, type, params) {
        if (this._formatter === undefined) {
            this._formatter = this.getFormatter();
        }
        if (this.language) {
          params = {
              language: this.language,
              ...params
          };
        }
        return this._formatter.format(value, type, params);
    }
};
module.exports.init();

const ClassHelper = require('../helper/ClassHelper');
const FileHelper = require('../helper/FileHelper');
const ObjectHelper = require('../helper/ObjectHelper');
const StringHelper = require('../helper/StringHelper');
const Forbidden = require('../error/http/Forbidden');
const ActionEvent = require('./ActionEvent');
const Response = require('../web/Response');
const path = require('path');