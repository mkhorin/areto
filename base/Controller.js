'use strict';

const Base = require('./Component');
const ClassHelper = require('../helpers/ClassHelper');
const StringHelper = require('../helpers/StringHelper');

module.exports = class Controller extends Base {

    static getExtendedProperties () {
        return ['METHODS','ACTIONS'];
    }
    
    static getConstants () {
        return {            
            // class name PostNum -> post-num 
            NAME: this.getName(),
            DEFAULT_ACTION: 'index',
            // VIEW_CLASS: require('./View'), // by default inherited from module
            // VIEW_LAYOUT: 'default', // by default inherited from module
            // INLINE_ACTION_CLASS: require('./InlineAction'), // by default inherited from module
            // declares allow methods for action if not set then all, name: [ 'GET', 'POST' ]
            METHODS: {}, // 'logout': ['POST']
            // declares external actions for the controller
            ACTIONS: {}, // 'captcha': { Class: require('areto/captcha/CaptchaAction'), ... }            
            EVENT_BEFORE_ACTION: 'beforeAction',
            EVENT_AFTER_ACTION: 'afterAction'
        };
    }
    
    static getName () {
        let index = this.name.indexOf('Controller');
        if (index === -1) {
            throw new Error(`${this.name}: Invalid class name: ${this.name}`);
        }
        return StringHelper.camelToId(this.name.substring(0, index));
    }

    static getFullName (separator = '.') {
        return this.module.getFullName(separator) + separator + this.NAME;
    }

    static getNestedDir () {
        if (this._NESTED_DIR === undefined) {
            this._NESTED_DIR = FileHelper.getNestedDir(this.CLASS_FILE, this.module.getControllerDir());
        }
        return this._NESTED_DIR;
    }

    static getModelClass () {
        if (this._MODEL_CLASS === undefined) {
            try {
                let name = this.name.substring(0, this.name.lastIndexOf('Controller'));
                this._MODEL_CLASS = require(this.module.getPath('models', this.getNestedDir(), name));
            } catch (err) {
                this._MODEL_CLASS = null;
            }
        }
        return this._MODEL_CLASS;
    }

    constructor (config) {
        super(Object.assign({            
            action: null,
            layout: 'main',
            response: new Response
        }, config));
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
        this.language = res.locals.language || (this.module.components.i18n
            && this.module.components.i18n.getActiveNotSourceLanguage());
        this.timestamp = (new Date).getTime();
        return this;
    }

    assignFrom (controller) {
        this.req = controller.req;
        this.res = controller.res;
        this.next = controller.next;
        this.err = controller.err;
        this.user = controller.user;
        this.language = controller.language;
        this.timestamp = controller.timestamp;
        return this;
    }

    execute (name) {
        this.action = this.createAction(name);
        if (!this.action) {
            return this.throwError(`${this.constructor.getFullName()}: unable to create action: ${name}`);
        }
        async.series([
            this.triggerBeforeAction.bind(this),
            this.action.execute.bind(this.action),
            this.triggerAfterAction.bind(this)
        ], err => {
            err ? this.throwError(err) : this.response.end(this);
        });
    }

    createAction (name) {
        name = name || this.DEFAULT_ACTION;
        let action = this.ACTIONS[name];
        if (Object.prototype.hasOwnProperty.call(this.ACTIONS, name)) {
            return ClassHelper.createInstance(this.ACTIONS[name], {
                name,
                controller: this
            });
        }
        let method = `action${StringHelper.idToCamel(name)}`;
        let InlineAction = this.INLINE_ACTION_CLASS || this.module.INLINE_ACTION_CLASS;
        return typeof this[method] === 'function' ? new InlineAction({
            name,
            controller: this,
            method: this[method]
        }) : null;
    }

    triggerBeforeAction (cb) {
        // trigger module's beforeAction from root to current
        async.eachSeries(this.module.getAncestry().slice().reverse(), (module, cb)=> {
            module.beforeAction(this.action, cb);
        }, err => {
            err ? cb(err) : this.beforeAction(cb);
        });
    }

    triggerAfterAction (cb) {
        this.afterAction(err => {
            // trigger module's afterAction from current to root
            err ? cb(err) : async.eachSeries(this.module.getAncestry(), (module, cb)=> {
                module.afterAction(this.action, cb);
            }, cb);
        });
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

    getQueryParam (key, defaultValue) {
        return Object.prototype.hasOwnProperty.call(this.req.query, key) ? this.req.query[key] : defaultValue;
    }

    getQueryParams () {
        return this.req.query;
    }

    getBodyParam (key, defaultValue) {
        return Object.prototype.hasOwnProperty.call(this.req.body, key) ? this.req.body[key] : defaultValue;
    }

    getBodyParams () {
        return this.req.body;
    }

    getCurrentRoute () {
        return this.req.baseUrl + this.req.path;
    }
    
    getHeader (name) {
        return this.req.get(name);
    }
  
    // FLASH MESSAGES

    setFlash (key, msg) {
        typeof this.req.flash === 'function'
            ? this.req.flash(key, msg)
            : this.log('error', `${this.constructor.name}: Session flash not found:`, msg);
    }

    getFlash (key) {
        return typeof this.req.flash === 'function' ? this.req.flash(key) : null;
    }
    
    // RESPONSE

    goHome () {
        this.redirect(this.module.getHomeUrl());
    }

    goLogin () {
        this.redirect(this.user.params.loginUrl);
    }

    goBack (url) {
        this.redirect(this.user.getReturnUrl(url));
    }

    reload () {
        this.response.code = 200;
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

    render (template, params, cb) {
        (new (this.VIEW_CLASS || this.module.VIEW_CLASS)({
            controller: this
        })).render(this.getTemplateName(template), params, (err, content)=> {
            cb ? cb(err, content) : err ? this.action.complete(err) : this.send(content);
        });
    }

    getTemplateName (template) {
        template = String(template);
        return template.indexOf('/') === -1 && template.indexOf(':') === -1
            ? `${this.NAME}/${template}` : template;
    }

    send (data, code) {
        this.response.send('send', data, code);
        this.action.complete();
    }

    sendText (data, code) {
        this.send(data.toString(), code);
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

    throwError (err, status) {
        let Exception = require('../errors/HttpException');
        this.next(err instanceof Exception ? err : new Exception(status || 500, err));
    }

    throwBadRequest (err) {
        let Exception = require('../errors/BadRequestHttpException');
        this.next(new Exception(err));
    }

    throwNotFound (err) {
        let Exception = require('../errors/NotFoundHttpException');
        this.next(new Exception(err));
    }

    throwForbidden (err) {
        let Exception = require('../errors/ForbiddenHttpException');
        this.next(new Exception(err));
    }

    // URL

    createUrl (data) {        
        return this.module.app.resolveUrl(Url.create(data, this));
    }
    
    createSimpleUrl (data) {
        return Url.create(data, this);
    }

    // SECURITY

    can (name, cb, params) {
        this.user.can(name, (err, access)=> {
            err ? this.throwError(err) : access ? cb() : this.throwForbidden();
        }, params);
    }

    // I18N

    format (value, type, params) {
        if (this.language) {
            params = Object.assign({language: this.language}, params);
        }
        return this.module.components.formatter.format(value, type, params);
    }

    translate (category, message, params) {
        if (category instanceof Message) {
            message = category.message;
            params = category.params;
            category = category.category;
        }
        return category 
            ? this.module.components.i18n.translate(category, message, params, this.language)
            : this.module.components.i18n.format(message, params, this.language);
    }

    translateMessages (messages) {
        let keys = Object.keys(messages);
        for (let key of keys) {
            if (messages[key] instanceof Message) {
                messages[key] =  this.translate(messages[key]);
            }
        }
        return messages;
    }
};
module.exports.init();

const async = require('async');
const FileHelper = require('../helpers/FileHelper');
const ObjectHelper = require('../helpers/ObjectHelper');
const ActionEvent = require('./ActionEvent');
const Response = require('../web/Response');
const Message = require('../i18n/Message');
const Url = require('../web/Url');