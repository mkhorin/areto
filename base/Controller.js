/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Component');
const ClassHelper = require('../helper/ClassHelper');
const StringHelper = require('../helper/StringHelper');

module.exports = class Controller extends Base {

    static getExtendedClassProps () {
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
                // 'captcha': { Class: require('areto/captcha/CaptchaAction'), ... }
            },
            EVENT_BEFORE_ACTION: 'beforeAction',
            EVENT_AFTER_ACTION: 'afterAction',
            DEFAULT_ACTION: 'index',
            CONTROLLER_DIR: 'controller',
            MODEL_DIR: 'model',
            // inherited from module by default
            // ACTION_VIEW: require('./ActionView'),
            // VIEW_LAYOUT: 'default',
            // INLINE_ACTION: require('./InlineAction')
        };
    }

    static getName () {
        let index = this.name.lastIndexOf('Controller');
        if (index === -1) {
            throw new Error(this.wrapClassMessage(`Invalid controller name: ${this.name}`));
        }
        return StringHelper.camelToId(this.name.substring(0, index));
    }

    static getFullName (separator = '.') {
        return this.module.getFullName(separator) + separator + this.NAME;
    }

    static getActionKeys () {
        let keys = Object.keys(this.ACTIONS);
        for (let key of ObjectHelper.getAllFunctionNames(this.prototype)) {
            if (key.indexOf('action') === 0) {
                keys.push(StringHelper.camelToId(key.substring(6)));
            }
        }
        return keys;
    }

    static getModelClass () {
        if (!this.hasOwnProperty('_MODEL_CLASS')) {
            let closest = FileHelper.getClosestDir(this.CONTROLLER_DIR, this.CLASS_DIR);
            let dir = path.join(this.MODEL_DIR, this.getNestedDir(), this.getModelClassName());
            this._MODEL_CLASS = require(path.join(path.dirname(closest), dir));
        }
        return this._MODEL_CLASS;
    }

    static getModelClassName () {
        return this.name.substring(0, this.name.lastIndexOf('Controller'));
    }

    static getViewDir () {
        if (!this.hasOwnProperty('_VIEW_DIR')) {
            this._VIEW_DIR = this.getNestedDir()
                ? `${this.getNestedDir()}/${this.NAME}/`
                : `${this.NAME}/`;
        }
        return this._VIEW_DIR;
    }

    static getNestedDir () {
        if (!this.hasOwnProperty('_NESTED_DIR')) {
            this._NESTED_DIR = FileHelper.getRelativePathByDir(this.CONTROLLER_DIR, this.CLASS_DIR);
        }
        return this._NESTED_DIR;
    }

    constructor (config) {
        super(config);
        this.response = new Response;
        this.response.controller = this;
        this.i18n = this.module.components.get('i18n');
        this.formatter = this.module.components.get('formatter');
        this.language = this.language || (this.i18n && this.i18n.getActiveNotSourceLanguage());
        this.timestamp = Date.now();
    }

    createModel (params) {
        return this.spawn(this.getModelClass(), {user: this.user, ...params});
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
            throw new Error(this.wrapClassMessage(`Unable to create action: ${name}`));
        }
        // trigger module's beforeAction from root to current
        for (let module of this.module.getAncestry().slice().reverse()) {
            await module.beforeAction(this.action);
        }
        await this.beforeAction();
        if (!this.response.has()) { // check to response by beforeActions
            await this.action.execute();
        }
        await this.afterAction();
        // trigger module's afterAction from current to root
        for (let module of this.module.getAncestry()) {
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
        let method = `action${StringHelper.idToCamel(name)}`;
        if (typeof this[method] === 'function') {
            return ClassHelper.spawn(this.INLINE_ACTION || this.module.InlineAction, {
                controller: this,              
                method: this[method], 
                name                
            });
        }
    }

    createMapAction (name) {
        if (Object.prototype.hasOwnProperty.call(this.ACTIONS, name)) {
            return ClassHelper.spawn(this.ACTIONS[name], {controller: this, name});
        }
    }

    // EVENTS

    beforeAction () {
        // if override this method call - await super.beforeAction()
        return this.trigger(this.EVENT_BEFORE_ACTION, new ActionEvent(this.action));
    }

    afterAction () {
        // if override this method call - await super.afterAction()
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

    // REQUEST

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
            ? this.req.flash(key, message)
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

    setHttpHeader (...args) {
        this.res.set(...args);
        return this;
    }

    // RENDER

    render (template, data, send = true) {
        let model = this.createViewModel(template, {data});
        return model ? this.renderViewModel(model, template, send)
                     : this.renderTemplate(template, data, send);
    }

    async renderViewModel (model, template, send) {
        let data = await model.getTemplateData();
        return this.renderTemplate(template, data, send);
    }

    async renderTemplate (template, data, send = true) {
        let content = await this.getView().render(this.getViewFileName(template), data);
        send && this.send(content);
        return content;
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
        return ClassHelper.spawn(this.ACTION_VIEW || this.module.ActionView, {            
            controller: this,
            theme: this.module.get('view').getTheme(),
            ...params
        });
    }

    getViewFileName (name) {
        if (typeof name !== 'string') {
            name = String(name);
        }
        return path.isAbsolute(name) ? name : (this.constructor.getViewDir() + name);
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

    createUrl (data) {        
        return this.module.components.get('url').resolve(data, this.NAME);
    }

    getHostUrl () {
        return this.req.protocol +'://'+ this.req.get('host');
    }

    // SECURITY

    async can (name, params) {
        if (!await this.user.can(name, params)) {
            throw new Forbidden;
        }
    }

    // I18N

    translate (message, category = 'app', params) {
        if (Array.isArray(message)) {
            return this.translate(...message);
        }
        if (message instanceof Message) {
            return message.translate(this.i18n, this.language);
        }
        return category
            ? this.i18n.translate(message, category, params, this.language)
            : this.i18n.format(message, params, this.language);
    }

    translateMessageMap (map, category = 'app') {
        map = {...map};
        for (let key of Object.keys(map)) {
            map[key] = this.translate(map[key], category);
        }
        return map;
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