'use strict';

const Base = require('./Component');
const ClassHelper = require('../helper/ClassHelper');
const StringHelper = require('../helper/StringHelper');
const CONTROLLER_SUFFIX = 'Controller';

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
            // declares allow methods for action if not set then all, name: [ 'GET', 'POST' ]
            METHODS: {
                // 'logout': ['POST']
            },
            // declares external actions for the controller
            ACTIONS: {
                // 'captcha': { Class: require('areto/captcha/CaptchaAction'), ... }
            },
            EVENT_BEFORE_ACTION: 'beforeAction',
            EVENT_AFTER_ACTION: 'afterAction',
            DEFAULT_ACTION: 'index',
            // inherited from module by default
            // VIEW_CLASS: require('./ActionView'),
            // VIEW_LAYOUT: 'default',
            // INLINE_ACTION_CLASS: require('./InlineAction')
        };
    }

    static getStatics () {
        return {
            // prevent to get value from parent classes
            _MODEL_CLASS: undefined,
            _NESTED_DIR: undefined,
            _VIEW_DIR: undefined
        };
    }
    
    static getName () {
        let index = this.name.lastIndexOf(CONTROLLER_SUFFIX);
        if (index === -1 || this.name.substring(index) !== CONTROLLER_SUFFIX) {
            throw new Error(this.wrapClassMessage('Invalid class name'));
        }
        return StringHelper.camelToId(this.name.substring(0, index));
    }

    static getFullName (separator = '.') {
        return this.module.getFullName(separator) + separator + this.NAME;
    }

    static getModelClass () {
        if (this._MODEL_CLASS === undefined) {
            try {
                this._MODEL_CLASS = this.module.require('model', this.getNestedDir(), this.getModelClassName());
            } catch (err) {
                this._MODEL_CLASS = null;
            }
        }
        return this._MODEL_CLASS;
    }

    static getModelClassName () {
        return this.name.substring(0, this.name.lastIndexOf(CONTROLLER_SUFFIX));
    }

    static getNestedDir () {
        if (this._NESTED_DIR === undefined) {
            this._NESTED_DIR = FileHelper.getNestedDir(this.CLASS_FILE, this.module.getControllerDir());
        }
        return this._NESTED_DIR;
    }

    static getViewDir () {
        if (this._VIEW_DIR === undefined) {
            this._VIEW_DIR = this.getNestedDir()
                ? `${this.getNestedDir()}/${this.NAME}/`
                : `${this.NAME}/`;
        }
        return this._VIEW_DIR;
    }

    init () {
        super.init();
        this.response = new Response;
        this.response.controller = this;
        this.i18n = this.module.components.i18n;
    }

    getModelClass () {
        return this.constructor.getModelClass();
    }

    createModel (params) {
        return new (this.getModelClass())(params);
    }

    getActionIds () {
        let ids = Object.keys(this.ACTIONS);
        for (let id of ObjectHelper.getAllFunctionNames(this)) {
            if (id.indexOf('action') === 0) {
                ids.push(StringHelper.camelToId(id.substring(6)));
            }
        }
        return ids;
    }

    assign (req, res, next, err) {
        this.req = req;
        this.res = res;
        this.next = next;
        this.err = err;
        this.user = res.locals.user;
        this.language = res.locals.language || (this.i18n && this.i18n.getActiveNotSourceLanguage());
        this.timestamp = Date.now();
        return this;
    }

    execute (name) {
        this.action = this.createAction(name);
        if (!this.action) {
            return this.throwError(this.wrapClassMessage(`Unable to create action: ${name}`));
        }
        AsyncHelper.series([
            cb => this.triggerBeforeAction(cb),
            cb => this.action.execute(cb),
            cb => this.triggerAfterAction(cb)
        ], err => {
            err ? this.throwError(err) : this.response.end();
        });
    }

    createAction (name) {
        name = name || this.DEFAULT_ACTION;
        return this.createInlineAction(name) || this.createMapAction(name);
    }

    createInlineAction (name) {
        let method = `action${StringHelper.idToCamel(name)}`;
        if (typeof this[method] !== 'function') {
            return null;
        }
        return ClassHelper.createInstance(this.INLINE_ACTION_CLASS || this.module.INLINE_ACTION_CLASS, {
            name,
            controller: this,
            method: this[method]
        });
    }

    createMapAction (name) {
        if (Object.prototype.hasOwnProperty.call(this.ACTIONS, name)) {
            return ClassHelper.createInstance(this.ACTIONS[name], {
                name,
                controller: this
            });
        }
    }

    triggerBeforeAction (cb) {
        // trigger module's beforeAction from root to current
        AsyncHelper.eachSeries(this.module.getAncestry().slice().reverse(), (module, cb)=> {
            module.beforeAction(this.action, cb);
        }, err => {
            err ? cb(err) : this.beforeAction(cb);
        });
    }

    triggerAfterAction (cb) {
        AsyncHelper.series([
            cb => this.afterAction(cb),
            // trigger module's afterAction from current to root
            cb => AsyncHelper.eachSeries(this.module.getAncestry(), (module, cb)=> {
                module.afterAction(this.action, cb);
            }, cb)
        ], cb);
    }

    // EVENTS

    beforeAction (cb) {
        // if override this method call - super.beforeAction(cb)
        this.triggerCallback(this.EVENT_BEFORE_ACTION, cb, new ActionEvent(this.action));
    }

    afterAction (cb) {
        this.triggerCallback(this.EVENT_AFTER_ACTION, cb, new ActionEvent(this.action));
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

    getQueryParam (key, defaults) {
        return ObjectHelper.getValue(key, this.req.query, defaults);
    }

    getQueryParams () {
        return this.req.query;
    }

    getBodyParam (key, defaults) {
        return ObjectHelper.getValue(key, this.req.body, defaults);
    }

    getBodyParams () {
        return this.req.body;
    }

    getCurrentRoute () {
        return this.req.baseUrl + this.req.path;
    }

    // FLASH MESSAGES

    setFlash (key, msg) {
        typeof this.req.flash === 'function'
            ? this.req.flash(key, msg)
            : this.log('error', 'Session flash not found', msg);
    }

    getFlash (key) {
        return typeof this.req.flash === 'function' ? this.req.flash(key) : null;
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
        this.action.complete();
    }

    redirect (url) {
        this.response.redirect(this.createUrl(url));
        this.action.complete();
    }

    setHttpStatus (code) {
        this.response.code = code;
        return this;
    }

    setHttpHeader (name, value) {
        this.res.set(name, value);
    }

    render (template, params, cb, view) {
        view = view || this.getView();
        view.render(this.getViewFileName(template), params, (err, content)=> {
            cb ? cb(err, content)
               : err ? this.action.complete(err)
                     : this.send(content);
        });
    }

    getView () {
        if (!this._view) {
            this._view = this.createView();
        }
        return this._view;
    }

    createView (params) {
        return new (this.VIEW_CLASS || this.module.VIEW_CLASS)(Object.assign({
            controller: this,
            theme: this.module.components.view.getTheme()
        }, params));
    }

    getViewFileName (name) {
        if (typeof name !== 'string') {
            name = String(name);
        }
        return name.indexOf('/') === -1 && name.indexOf(':') === -1
            ? this.constructor.getViewDir() + name
            : name;
    }

    // SEND

    send (data, code) {
        this.response.send('send', data, code);
        this.action.complete();
    }

    sendText (data, code) {
        this.send(typeof data === 'string' ? data : String(data), code);
    }

    sendFile (data, code) {
        this.response.send('download', data, code);
        this.action.complete();
    }

    sendJson (data, code) {
        this.response.send('json', data, code);
        this.action.complete();
    }

    sendStatus (code) {
        this.response.send('sendStatus', code);
        this.action.complete();
    }

    sendData (data, encoding) {
        this.response.sendData(data, encoding);
        this.action.complete();
    }

    // THROW

    throwError (err, status) {
        let Exception = require('../error/HttpException');
        if (!(err instanceof Exception)) {
            err = new Exception(status || 500, err);
        }
        this.next(err);
    }

    throwBadRequest (err) {
        let Exception = require('../error/BadRequestHttpException');
        this.next(new Exception(err));
    }

    throwNotFound (err) {
        let Exception = require('../error/NotFoundHttpException');
        this.next(new Exception(err));
    }

    throwForbidden (err) {
        let Exception = require('../error/ForbiddenHttpException');
        this.next(new Exception(err));
    }

    // URL

    getOriginalUrl () {
        return this.req.originalUrl;
    }

    createUrl (data) {        
        return this.module.app.resolveUrl(Url.create(data, this.module, this));
    }
    
    createSimpleUrl (data) {
        return Url.create(data, this.module, this);
    }

    // SECURITY

    can (name, cb, params) {
        this.user.can(name, (err, access)=> {
            err ? this.throwError(err)
                : access ? cb() : this.throwForbidden();
        }, params);
    }

    // I18N

    translate (message, category = 'app', params) {
        if (message instanceof Array) {
            return this.translate.apply(this, message);
        }       
        if (message instanceof Message) {
            return message.translate(this.i18n, this.language);
        }    
        return category
            ? this.i18n.translate(message, category, params, this.language)
            : this.i18n.format(message, params, this.language);
    }

    translateMessageMap (map, category = 'app') {
        map = Object.assign({}, map);
        for (let key of Object.keys(map)) {
            map[key] = this.translate(map[key], category);
        }
        return map;
    }

    format (value, type, params) {
        return this.module.components.formatter.format(value, type, this.language ? Object.assign({
            language: this.language
        }, params) : params);
    }
};
module.exports.init();

const AsyncHelper = require('../helper/AsyncHelper');
const FileHelper = require('../helper/FileHelper');
const ObjectHelper = require('../helper/ObjectHelper');
const ActionEvent = require('./ActionEvent');
const Response = require('../web/Response');
const Message = require('../i18n/Message');
const Url = require('../web/Url');