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
    
    constructor (config) {
        super(Object.assign({
            modules: {},
            config: {},
            components: {}, // inherited
            params: {}, // inherited
            widgets: {} // inherited
        }, config));        

        this.parent = ClassHelper.getParentModule(this);
        this.app = this.parent ? this.parent.app : this;
        this._express = express();
        this._expressQueue = []; // for deferred assign
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
        return this.getControllerClass(this.config.defaultController || 'default');
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
        try {
            return require(path.join(this.getControllerDir(), `${StringHelper.idToCamel(id)}Controller`));
        } catch (e) {}
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

    beforeInit (cb) {
        this.triggerCallback(this.EVENT_BEFORE_INIT, cb);
    }

    afterComponentInit (cb) {
        this.triggerCallback(this.EVENT_AFTER_COMPONENT_INIT, cb);
    }

    afterModuleInit (cb) {
        this.triggerCallback(this.EVENT_AFTER_MODULE_INIT, cb);
    }

    afterInit (cb) {
        this.triggerCallback(this.EVENT_AFTER_INIT, cb);
    }

    beforeAction (action, cb) {
        this.triggerCallback(this.EVENT_BEFORE_ACTION, cb, new ActionEvent(action));
    }

    afterAction (action, cb) {
        this.triggerCallback(this.EVENT_AFTER_ACTION, cb, new ActionEvent(action));
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

    // CONFIG

    getParam (key, defaults) {
        return ObjectHelper.getNestedValue(key, this.params, defaults);
    }

    getConfig (key, defaults) {
        return ObjectHelper.getNestedValue(key, this.config, defaults);
    }

    setConfig (name) {
        this.configName = name;
        this.config = AssignHelper.deepAssign(
            this.getConfigFile('default'),
            this.getConfigFile('default-local'),
            this.getConfigFile(name),
            this.getConfigFile(`${name}-local`)
        );
    }

    getConfigFile (name) {
        let file = this.getPath('config', `${name}.js`);
        try {
            fs.statSync(file); // skip absent config file
        } catch (err) {
            return {};
        }
        return require(file);
    }

    configure (configName, cb) {
        this.setConfig(configName);
        Object.assign(this.params, this.config.params);
        Object.assign(this.widgets, this.config.widgets);
        if (this.parent) {
            Object.assign(this.components, this.parent.components);
            AssignHelper.deepAssignUndefined(this.params, this.parent.params);
            AssignHelper.deepAssignUndefined(this.widgets, this.parent.widgets);
        }
        this.setMountPath();
        if (this.config.forwarder) {
            this.setForwarder(this.config.forwarder);
        }
        AsyncHelper.series([
            cb => this.beforeInit(cb),
            cb => this.createComponents(this.config.components, cb),
            cb => this.afterComponentInit(cb),
            cb => this.createModules(this.config.modules, cb),
            cb => this.afterModuleInit(cb),
            cb => {
                this.createRouter(this.config.router);
                this.attachExpress();
                this.afterInit(cb);
            }
        ], cb);
    }

    setMountPath () {
        this.mountPath = this.config.mountPath || (this.parent ? `/${this.NAME}` : '/');
    }

    setForwarder (config) {
        this.forwarder = ClassHelper.createInstance({
            Class: require('../web/Forwarder'),
            module: this
        }, config);
    }

    createModules (config, cb) {
        AsyncHelper.eachOfSeries(config || {}, (config, id, cb)=> {
            if (!config) {
                this.log('info', `Module skipped: ${id}`);
                return cb();
            }
            let configName = config.configName || this.configName;
            let module = require(this.getPath('module', id, 'module'));
            this.modules[id] = module;
            module.configure(configName, err => {
                err ? this.log('error', `Module failed: ${id}`, err)
                    : this.log('info', `Module ready: ${id}`);
                setImmediate(cb);
            });
        }, cb);
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

    createComponents (components, cb) {
        components = components || {};
        this.extendComponentsByDefaults(components);
        AsyncHelper.eachOfSeries(components, (config, id, cb)=> {
            if (!config) {
                this.log('info', `Component skipped: ${id}`);
                return cb();
            }
            config.module = config.module || this;
            config.id = id;
            let name = config.setter || id;
            let method = `create${StringHelper.idToCamel(name)}Component`;
            AsyncHelper.series([
                cb => {
                    if (typeof this[method] === 'function') {
                        return this[method](id, config, cb);
                    }
                    this.createComponent(id, config);
                    setImmediate(cb);
                },
                cb => {
                    this.log('trace', `Component ready: ${id}`);
                    setImmediate(cb);
                }
            ], cb);
        }, cb);
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

    createAssetComponent (id, config, cb) {
        this.createComponent(id, Object.assign({
            Class: require('../web/asset/AssetManager')
        }, config));
        setImmediate(cb);
    }

    createBodyParserComponent (id, config, cb) {
        config = Object.assign({
            extended: true
        }, config);
        let bodyParser = require('body-parser');
        this.appendToExpress('use', bodyParser.json());
        this.appendToExpress('use', bodyParser.urlencoded(config));
        setImmediate(cb);
    }

    createCacheComponent (id, config, cb) {
        this.createComponent(id, Object.assign({
            Class: require('../cache/Cache')
        }, config));
        setImmediate(cb);
    }

    createConnectionComponent (id, config, cb) {
        this.createComponent(id, Object.assign({
            Class: require('../db/Connection')
        }, config));
        this.getDb().open(cb);
    }

    createCookieComponent (id, config, cb) {
        config = config || {};
        let cookieParser = require('cookie-parser');
        this.appendToExpress('use', cookieParser(config.secret, config.options));
        setImmediate(cb);
    }

    createFormatterComponent (id, config, cb) {
        this.createComponent(id, Object.assign({
            Class: require('../i18n/Formatter'),
            i18n: this.components.i18n
        }, config));
        setImmediate(cb);
    }

    createI18nComponent (id, config, cb) {
        this.createComponent(id, Object.assign({
            Class: require('../i18n/I18n'),
            parent: this.parent ? this.parent.components.i18n : null
        }, config));
        setImmediate(cb);
    }

    createLoggerComponent (id, config, cb) {
        this.createComponent(id, Object.assign({
            Class: require('../log/Logger')
        }, config)).configure(cb);
    }

    createRateLimitComponent (id, config, cb) {
        this.createComponent(id, Object.assign({
            Class: require('../web/rate-limit/RateLimit')
        }, config)).configure(cb);
    }

    createRbacComponent (id, config, cb) {
        this.createComponent(id, Object.assign({
            Class: require('../rbac/Rbac')
        }, config)).configure(cb);
    }

    createSchedulerComponent (id, config, cb) {
        this.createComponent(id, Object.assign({
            Class: require('../scheduler/Scheduler')
        }, config));
        setImmediate(cb);
    }

    createSessionComponent (id, config, cb) {
        this.createComponent(id, Object.assign({
            Class: require('../web/session/Session')
        }, config));
        setImmediate(cb);
    }

    createStaticComponent (id, config, cb) {
        // use static content handlers before others
        this.app.useBaseExpressHandler(this.getRoute(), express.static(this.getPath('web'), config.options));
        setImmediate(cb);
    }

    createViewComponent (id, config, cb) {
        this.createComponent(id, Object.assign({
            Class: require('../view/View'),
            parent: this.parent ? this.parent.getComponent(id) : null
        }, config)).configure(cb);
    }

    createViewEngineComponent (id, config, cb) {
        this.appendToExpress('engine', config.extension, config.engine);
        this.appendToExpress('set', 'view engine', config.extension);
        setImmediate(cb);
    }

    createUserComponent (id, config, cb) {
        this.createComponent(id, Object.assign({
            Class: require('../web/User')
        }, config));
        this.appendToExpress('use', this.handleUser);
        setImmediate(cb);
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
        res.locals.user.ensureIdentity(next);
    }
};
module.exports.init();

const fs = require('fs');
const path = require('path');
const express = require('express');
const AsyncHelper = require('../helper/AsyncHelper');
const ClassHelper = require('../helper/ClassHelper');
const CommonHelper = require('../helper/CommonHelper');
const ObjectHelper = require('../helper/ObjectHelper');
const AssignHelper = require('../helper/AssignHelper');
const ActionEvent = require('./ActionEvent');
const Connection = require('../db/Connection');
const Url = require('../web/Url');