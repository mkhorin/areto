'use strict';

let Base = require('./Component');
let inflector = require('../helpers/InflectorHelper');
let helper = require('../helpers/MainHelper');
let async = require('async');

module.exports = class Controller extends Base {

    static getExtendedProperties () {
        return ['METHODS','ACTIONS'];
    }
    
    static getConstants () {
        return {            
            // class name PostNum -> post-num 
            ID: this.getId(),
            DEFAULT_ACTION: 'index',
            VIEW_CLASS: require('./View'),
            // declares allow methods for action if not set then all, name: [ 'GET', 'POST' ]
            METHODS: {}, // 'logout': ['POST']
            // declares external actions for the controller
            ACTIONS: {}, // 'captcha': { Class: require('areto/captcha/CaptchaAction'), ... }            
            EVENT_BEFORE_ACTION: 'beforeAction',
            EVENT_AFTER_ACTION: 'afterAction'
        };
    }
    
    static getId () {
        let index = this.name.indexOf('Controller');
        if (index < 0) {
            throw new Error(`Controller: Invalid class name: ${this.name}`);
        }
        return inflector.camelToId(this.name.substring(0, index));
    }

    static getFullName (separator = '.') {
        return this.module.getFullName(separator) + separator + this.ID;
    }

    static getModelClass () {
        if (!this._modelClass) {
            try {
                let name = this.name.substring(0, this.name.lastIndexOf('Controller'));
                this._modelClass = require(this.module.getPath('models', name));
            } catch (err) {}    
        } 
        return this._modelClass;
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
    
    createModel () {
        return new (this.getModelClass());
    }

    getActionIds () {
        let ids = Object.keys(this.ACTIONS);
        for (let id of helper.getAllFunctionNames(this)) {
            if (id.indexOf('action') === 0) {
                ids.push(inflector.camelToId(id.substring(6)));
            }
        }
        return ids;
    }

    assignFrom (controller) {
        this.req = controller.req;
        this.res = controller.res;
        this.next = controller.next;
        this.err = controller.err;
        this.user = controller.user;
        this.timestamp = controller.timestamp;
        return this;
    }

    assign (req, res, next, err) {
        this.req = req;
        this.res = res;
        this.next = next;
        this.err = err;
        this.user = res.locals.user;
        this.timestamp = (new Date).getTime();
        return this;
    }

    execute (id) {
        this.action = this.createAction(id);
        if (this.action) {
            this.triggerBeforeAction(err => {
                err ? this.throwError(err) : this.action.execute(err => {
                    err ? this.throwError(err) : this.triggerAfterAction(err => {
                        err ? this.throwError(err) : this.response.end(this);
                    });
                });
            });
        } else {
            this.throwError(`Controller ${this.constructor.getFullName()}: unable to create action ${id}`);
        }
    }

    createAction (id) {
        id = id || this.DEFAULT_ACTION;
        let action = this.ACTIONS[id];
        if (action) {
            return helper.createInstance(action, {id, controller: this});
        }
        let name = `action${inflector.idToCamel(id)}`;
        return typeof this[name] === 'function'
            ? new InlineAction({id, controller: this, method: name}) : null;
    }

    triggerBeforeAction (cb) {
        // trigger module's beforeAction - from root to current
        async.eachSeries(this.module.getAncestry().slice().reverse(), (module, cb)=> {
            module.beforeAction(this.action, cb);
        }, err => {
            err ? cb(err) : this.beforeAction(cb);
        });
    }

    triggerAfterAction (cb) {
        this.afterAction(err => {
            // trigger module's afterAction - from current to root
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
        return key in this.req.query ? this.req.query[key] : defaultValue;
    }

    getQueryParams () {
        return this.req.query;
    }

    getBodyParam (key, defaultValue) {
        return key in this.req.body ? this.req.body[key] : defaultValue;
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
            : this.module.log('error', 'Controller: Session flash not found:', msg);
    }

    getFlash (key) {
        return typeof this.req.flash === 'function' ? this.req.flash(key) : null;
    }
    
    // RESPONSE

    goHome () {
        this.redirect(this.module.getHomeUrl());
    }

    goLogin () {
        this.redirect(this.user.opts.loginUrl);
    }

    goBack (url) {
        this.redirect(this.user.getReturnUrl(url));
    }

    redirect (url) {
        this.response.redirect(this.createUrl(url));
        this.action.complete();
    }

    setStatus (code) {
        this.response.code = code;
        return this;
    }

    render (template, params, cb) {
        let view = new this.VIEW_CLASS(this);
        view.render(`${this.ID}/${template}`, params, (err, content)=> {
            cb ? cb(err, content) : err ? this.action.complete(err) : this.send(content);
        });
    }

    send (data, code) {
        this.response.send('send', data, code);
        this.action.complete();
    }

    sendText (data, code) {
        this.send(data.toString(), code);
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
        return this.module.resolveUrl(Url.create(data, this));
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

    translate (category, message, params, language) {
        if (category instanceof Message) {
            message = category.message;
            params = category.params;
            language = category.language;
            category = category.category;
        }
        let i18n = this.module.components.i18n;
        language = language || this.res.locals.language || i18n.language;
        return category 
            ? i18n.translate(category, message, params, language) 
            : i18n.format(message, params, language);
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

let ActionEvent = require('./ActionEvent');
let InlineAction = require('./InlineAction');
let Response = require('../web/Response');
let Message = require('../i18n/Message');
let Url = require('../web/Url');