/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Component');
const StringHelper = require('../helper/StringHelper');

module.exports = class Controller extends Base {

    static getExtendedClassProperties () {
        return [
            'METHODS',
            'ACTIONS'
        ];
    }

    static getConstants () {
        return {
            NAME: this.getName(),
            // declare allowed methods for action if not set then all
            METHODS: {
                // 'logout': ['POST']
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

    static getName () {
        return StringHelper.camelToId(StringHelper.trimEnd(this.name, 'Controller'));
    }

    static getActionKeys () {
        const keys = Object.keys(this.ACTIONS);
        for (const key of ObjectHelper.getAllFunctionNames(this.prototype)) {
            if (key.indexOf('action') === 0) {
                keys.push(StringHelper.camelToId(key.substring(6)));
            }
        }
        return keys;
    }

    static getModelClass () {
        if (!this.hasOwnProperty('_MODEL_CLASS')) {
            const closest = FileHelper.getClosestDirectory(this.CONTROLLER_DIRECTORY, this.CLASS_DIRECTORY);
            const dir = path.join(this.MODEL_DIRECTORY, this.getNestedDirectory(), this.getModelClassName());
            this._MODEL_CLASS = require(path.join(path.dirname(closest), dir));
        }
        return this._MODEL_CLASS;
    }

    static getModelClassName () {
        return StringHelper.trimEnd(this.name, 'Controller');
    }

    static getViewDirectory () {
        if (!this.hasOwnProperty('_VIEW_DIRECTORY')) {
            const dir = this.getNestedDirectory();
            this._VIEW_DIRECTORY = dir ? `${dir}/${this.NAME}/` : `${this.NAME}/`;
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
        this.response = new Response;
        this.response.controller = this;
        this.formatter = this.module.components.get('formatter');
        this.i18n = this.module.components.get('i18n');
        this.language = this.language || this.i18n && this.i18n.language;
        this.timestamp = Date.now();
        this.urlManager = this.module.components.get('urlManager');
    }

    createModel (params) {
        return this.spawn(this.getModelClass(), {
            user: this.user,
            ...params
        });
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
        const modules = this.module.getAncestry();
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

    // ACTION

    createAction (name) {
        name = name || this.DEFAULT_ACTION;
        return this.createInlineAction(name) || this.createMapAction(name);
    }

    createInlineAction (name) {
        const method = this[`action${StringHelper.idToCamel(name)}`];
        if (typeof method === 'function') {
            return this.spawn(this.INLINE_ACTION || this.module.InlineAction, {
                controller: this,
                method,
                name
            });
        }
    }

    createMapAction (name) {
        if (Object.prototype.hasOwnProperty.call(this.ACTIONS, name)) {
            return this.spawn(this.ACTIONS[name], {controller: this, name});
        }
    }

    // EVENTS

    beforeAction () {
        // call await super.beforeAction() if override it
        return this.trigger(this.EVENT_BEFORE_ACTION, new ActionEvent(this.action));
    }

    afterAction () {
        // call await super.afterAction() if override it
        return this.trigger(this.EVENT_AFTER_ACTION, new ActionEvent(this.action));
    }
    
    // REQUEST

    isAjax () {
        return this.req.xhr;
    }

    isGet () {
        return this.req.method === 'GET';
    }

    isPost () {
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

    setFlash (key, message) {
        typeof this.req.flash === 'function'
            ? this.req.flash(key, this.translate(message))
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
        this.setHttpStatus(200);
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
        return this.getView().render(this.getViewFileName(template), data);
    }

    createViewModel (name, config = {}) {
        return this.getView().createViewModel(this.getViewFileName(name), config);
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
            theme: this.module.get('view').getTheme(),
            ...params
        });
    }

    getViewFileName (name) {
        name = typeof name !== 'string' ? String(name) : name;
        return path.isAbsolute(name) ? name : (this.constructor.getViewDirectory() + name);
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

    createUrl (...data) {
        return this.urlManager.resolve(data.length > 1 ? data : data[0], this.NAME);
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

    translate (message, source = 'app', params) {
        if (Array.isArray(message)) {
            return this.translate(...message);
        }
        if (message instanceof Message) {
            return message.translate(this.i18n, this.language);
        }
        return source
            ? this.i18n.translate(message, source, params, this.language)
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
        if (this.language) {
          params = {language: this.language, ...params};  
        } 
        return this.formatter.format(value, type, params);
    }
};
module.exports.init();

const path = require('path');
const FileHelper = require('../helper/FileHelper');
const ObjectHelper = require('../helper/ObjectHelper');
const Forbidden = require('../error/ForbiddenHttpException');
const ActionEvent = require('./ActionEvent');
const Response = require('../web/Response');
const Message = require('../i18n/Message');