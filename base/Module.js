/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Component');
const StringHelper = require('../helper/StringHelper');

module.exports = class Module extends Base {
    
    static getConstants () {
        return {
            NAME: this.getName(),
            DEFAULT_COMPONENTS: {
                'view': {}
            },
            EVENT_BEFORE_INIT: 'beforeInit',
            EVENT_AFTER_COMPONENT_INIT: 'afterComponentInit',
            EVENT_AFTER_MODULE_INIT: 'afterModuleInit',
            EVENT_AFTER_INIT: 'afterInit',
            EVENT_BEFORE_ACTION: 'beforeAction',
            EVENT_AFTER_ACTION: 'afterAction',

            INLINE_ACTION_CLASS: require('./InlineAction'),
            VIEW_CLASS: require('../view/ActionView'), // default action view
            VIEW_LAYOUT: 'default', // default template layout
        };
    }

    static getName () {
        return StringHelper.camelToId(this.name);
    }
    
    constructor () {
        super();
        this._express = express();
        this._expressQueue = []; // for deferred assign
        this.modules = {};
        this.components = {}; // inherited from parent
        this.params = {}; // inherited from parent
        this.widgets = {}; // inherited from parent
        this.setParent();
    }

    setParent () {
        this.parent = ClassHelper.getParentModule(this);
        this.app = this.parent.app;
    }

    getConfig () {
        return this.config.get.apply(this.config, arguments);
    }

    getParam (key, defaults) {
        return ObjectHelper.getNestedValue(key, this.params, defaults);
    }

    getFullName (separator = '.') { // eg - app.admin.post
        return this.parent
            ? `${this.parent.getFullName(separator)}${separator}${this.NAME}`
            : this.NAME;
    }

    getDb (id = 'connection') {
        return this.components[id] instanceof Connection
            ? this.components[id].driver
            : null;
    }

    getRoute (url) {
        if (this._route === undefined) {
            this._route = this.parent.getRoute() + this.mountPath;
        }
        return url ? `${this._route}/${url}` : this._route;
    }

    getAncestry () {
        if (!this._ancestry) {
            this._ancestry = [this];
            let current = this;
            while (current.parent) {
                current = current.parent;
                this._ancestry.push(current);
            }
        }
        return this._ancestry;
    }

    getPath (...args) {
        return path.join.apply(path, [path.dirname(this.CLASS_FILE)].concat(args));
    }

    getRelativePath (file) {
        return file.substring(this.getPath().length + 1);
    }

    getControllerDir () {
        return this.getPath('controller');
    }

    getDefaultController () {
        return this.getControllerClass(this.getConfig('defaultController', 'default'));
    }

    require (...args) {
        return require(this.getPath.apply(this, args));
    }

    getModule (name) {
        if (typeof name !== 'string') {
            return null;
        }
        if (this.modules[name] instanceof Module) {
            return this.modules[name];
        }
        let pos = name.indexOf('.');
        if (pos === -1) {
            return null;
        }
        let module = this.modules[name.substring(0, pos)];
        return module instanceof Module
            ? module.getModule(name.substring(pos + 1))
            : null;
    }

    getControllerClass (id) {
        return require(path.join(this.getControllerDir(), `${StringHelper.idToCamel(id)}Controller`));
    }

    log (type, message, data) {
        CommonHelper.log(type, message, data, this.getFullName(), this.components.logger);
    }

    // URL

    getHomeUrl () {
        return this.params.homeUrl || '/';
    }

    resolveUrl (url) {
        let newUrl = this.app.getUrlFromCache(url);
        if (!newUrl) {
            newUrl = this.resolveSourceUrl(Url.parse(url)) || url;
            this.app.setUrlToCache(newUrl, url);
        }
        return newUrl;
    }

    resolveSourceUrl (data) {
        return (this.forwarder && this.forwarder.createSourceUrl(data))
            || (this.parent && this.parent.resolveSourceUrl(data));
    }

    // EVENTS

    beforeInit () {
        return this.triggerWait(this.EVENT_BEFORE_INIT);
    }

    afterComponentInit () {
        return this.triggerWait(this.EVENT_AFTER_COMPONENT_INIT);
    }

    afterModuleInit () {
        return this.triggerWait(this.EVENT_AFTER_MODULE_INIT);
    }

    afterInit () {
        return this.triggerWait(this.EVENT_AFTER_INIT);
    }

    beforeAction (action) {
        return this.triggerWait(this.EVENT_BEFORE_ACTION, new ActionEvent(action));
    }

    afterAction (action) {
        return this.triggerWait(this.EVENT_AFTER_ACTION, new ActionEvent(action));
    }

    // EXPRESS SETUP QUEUES

    appendToExpress (method, ...args) {
        this._expressQueue.push({method, args});
    }

    assignExpressQueue () {
        for (let module of Object.values(this.modules)) {
            module.assignExpressQueue();
        }
        for (let item of this._expressQueue) {
            this.log('trace', item.method, item.args[0]);
            this._express[item.method].apply(this._express, item.args);
        }
    }

    // INIT

    async init (config) {
        Object.assign(this, config);
        this.createConfiguration();
        this.assignParams();
        this.setMountPath();
        this.setForwarder(this.getConfig('forwarder'));
        this.setStaticSource(this.getParam('static'));
        this.setTemplateEngine(this.getParam('template'));
        await this.beforeInit();
        await this.initComponents(this.getConfig('components'));
        await this.afterComponentInit();
        await this.initModules(this.getConfig('modules'));
        await this.afterModuleInit();
        this.createRouter(this.getConfig('router'));
        this.attachExpress();
        await this.afterInit();
        this.log('info', `Configured as ${this.config.getTitle()}`);
    }

    createConfiguration () {
        let Configuration = this.Configuration || require('./Configuration');
        this.config = new Configuration(this.getPath('config'), this.configName);
    }

    assignParams () {
        Object.assign(this.params, this.getConfig('params'));
        Object.assign(this.widgets, this.getConfig('widgets'));
        if (this.parent) {
            Object.assign(this.components, this.parent.components);
            AssignHelper.deepAssignUndefined(this.params, this.parent.params);
            AssignHelper.deepAssignUndefined(this.widgets, this.parent.widgets);
        }
    }

    setMountPath () {
        this.mountPath = this.getConfig('mountPath', this.parent ? `/${this.NAME}` : '/');
    }

    setForwarder (config) {
        if (config) {
            this.forwarder = ClassHelper.createInstance(Object.assign({
                Class: require('../web/Forwarder'),
                module: this
            }, config));
        }
    }

    setTemplateEngine (params) {
        if (params) {
            this.appendToExpress('engine', params.extension, params.engine);
            this.appendToExpress('set', 'view engine', params.extension);
            this.appendToExpress('set', 'views', params.views || '/');
        }
    }

    setStaticSource (params) {
        if (params) {
            let dir = this.getPath(params.dir || 'web');
            if (fs.existsSync(dir)) {
                // use static content handlers before others
                this.app.useBaseExpressHandler(this.getRoute(), express.static(dir, params.options));
            }
        }
    }

    async initModules (config = {}) {
        for (let key of Object.keys(config)) {
            await this.initModule(key, config[key]);
        }
    }

    initModule (id, config) {
        if (!config) {
            return this.log('info', `Module skipped: ${id}`);
        }
        let module = require(this.getPath('module', id, 'module'));
        this.modules[id] = module;
        return module.init(config);
    }

    createRouter (config) {
        this.router = ClassHelper.createInstance(Object.assign({
            Class: require('../web/Router'),
            module: this
        }, config));
    }

    attachExpress () {
        if (this.parent) {
            this.parent.appendToExpress('use', this.mountPath, this._express);
        }
        this._express.use(this.handleModule.bind(this));
    }

    // COMPONENTS

    hasComponent (name) {
        return Object.prototype.hasOwnProperty.call(this.components, name);
    }

    getComponent (name) {
        return this.hasComponent(name) ? this.components[name] : null;
    }

    getComponentFromParent (name) {
        return this.parent ? this.parent.getComponent(name) : null;
    }

    async initComponents (components) {
        components = components || {};
        this.extendComponentsByDefaults(components);
        for (let id of Object.keys(components)) {
            await this.initComponent(id, components[id]);
        }
    }

    async initComponent (id, config) {
        if (!config) {
            return this.log('info', `Component skipped: ${id}`);
        }
        config.module = config.module || this;
        config.id = id;
        let name = config.setter || id;
        let method = `create${StringHelper.idToCamel(name)}Component`;
        typeof this[method] === 'function'
            ? await this[method](id, config)
            : await this.createComponent(id, config);
        this.log('trace', `Component ready: ${id}`);
    }

    extendComponentsByDefaults (components) {
        for (let name of Object.keys(this.DEFAULT_COMPONENTS)) {
            if (!Object.prototype.hasOwnProperty.call(components, name)) {
                components[name] = this.DEFAULT_COMPONENTS[name];
            }
        }
    }

    createComponent (id, config) {
        return this.components[id] = ClassHelper.createInstance(config);
    }

    deepAssignComponent (name, newComponent) {
        let currentComponent = this.components[name];
        for (let module of Object.values(this.modules)) {
            if (module.components[name] === currentComponent) {
                module.deepAssignComponent(name, newComponent);
            }
        }
        this.components[name] = newComponent;
    }

    createAssetComponent (id, config) {
        this.createComponent(id, Object.assign({
            Class: require('../web/asset/AssetManager')
        }, config));
    }

    createBodyParserComponent (id, config) {
        config = Object.assign({
            extended: true
        }, config);
        let bodyParser = require('body-parser');
        this.appendToExpress('use', bodyParser.json());
        this.appendToExpress('use', bodyParser.urlencoded(config));
    }

    createCacheComponent (id, config) {
        this.createComponent(id, Object.assign({
            Class: require('../cache/Cache')
        }, config));
    }

    createConnectionComponent (id, config) {
        this.createComponent(id, Object.assign({
            Class: require('../db/Connection')
        }, config)).init();
        return this.getDb().open();
    }

    createCookieComponent (id, config) {
        config = config || {};
        let cookieParser = require('cookie-parser');
        this.appendToExpress('use', cookieParser(config.secret, config.options));
    }

    createFormatterComponent (id, config) {
        this.createComponent(id, Object.assign({
            Class: require('../i18n/Formatter'),
            i18n: this.components.i18n
        }, config));
    }

    createI18nComponent (id, config) {
        this.createComponent(id, Object.assign({
            Class: require('../i18n/I18n'),
            parent: this.parent ? this.parent.components.i18n : null
        }, config));
    }

    createLoggerComponent (id, config) {
        return this.createComponent(id, Object.assign({
            Class: require('../log/Logger')
        }, config)).init();
    }

    createRateLimitComponent (id, config) {
        return this.createComponent(id, Object.assign({
            Class: require('../web/rate-limit/RateLimit')
        }, config)).init();
    }

    createRbacComponent (id, config) {
        return this.createComponent(id, Object.assign({
            Class: require('../rbac/Rbac')
        }, config)).init();
    }

    createSchedulerComponent (id, config) {
        this.createComponent(id, Object.assign({
            Class: require('../scheduler/Scheduler')
        }, config));
    }

    createSessionComponent (id, config) {
        this.createComponent(id, Object.assign({
            Class: require('../web/session/Session')
        }, config));
    }

    createViewComponent (id, config) {
        return this.createComponent(id, Object.assign({
            Class: require('../view/View'),
            parent: this.parent ? this.parent.getComponent(id) : null
        }, config)).init();
    }

    createUserComponent (id, config) {
        this.createComponent(id, Object.assign({
            Class: require('../web/User')
        }, config));
        this.appendToExpress('use', this.handleUser);
    }

    // MIDDLEWARE

    handleModule (req, res, next) {
        res.locals.module = this;
        if (this.forwarder) {
            this.forwarder.forward(req);
        }
        next();
    }

    handleUser (req, res, next) {
        let module = res.locals.module;
        res.locals.user = module.components.user.createWebUser(req, res, next);
        // try to identify the user immediately, otherwise have to do a callback for isGuest and etc
        PromiseHelper.callback(res.locals.user.ensureIdentity(), next);
    }
};
module.exports.init();

const fs = require('fs');
const path = require('path');
const express = require('express');
const ClassHelper = require('../helper/ClassHelper');
const CommonHelper = require('../helper/CommonHelper');
const ObjectHelper = require('../helper/ObjectHelper');
const AssignHelper = require('../helper/AssignHelper');
const PromiseHelper = require('../helper/PromiseHelper');
const ActionEvent = require('./ActionEvent');
const Connection = require('../db/Connection');
const Url = require('../web/Url');