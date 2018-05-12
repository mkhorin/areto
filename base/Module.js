'use strict';

const Base = require('./Component');
const StringHelper = require('../helpers/StringHelper');

module.exports = class Module extends Base {
    
    static getConstants () {
        return {
            NAME: this.getName(),
            DEFAULT_COMPONENTS: {
                'template': {}
            },
            EVENT_BEFORE_INIT: 'beforeInit',
            EVENT_AFTER_COMPONENT_SET: 'afterComponentSet',
            EVENT_AFTER_MODULE_SET: 'afterModuleSet',
            EVENT_AFTER_INIT: 'afterInit',
            EVENT_BEFORE_ACTION: 'beforeAction',
            EVENT_AFTER_ACTION: 'afterAction',
            VIEW_CLASS: require('./View'), // default controller view
            VIEW_LAYOUT: 'default', // default controller template layout
            INLINE_ACTION_CLASS: require('./InlineAction')
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
    }
    
    init () {
        super.init();
        this._express = express();
        this._expressQueue = []; // for deferred assign
        this._afterComponentInitHandlers = {};
        this._afterModuleInitHandlers = {};
    }

    getDb (id = 'connection') {
        return this.components[id] instanceof Connection ? this.components[id].driver : null;
    }

    getFullName (separator = '.') { // eg - app.admin.post
        return this.parent ? `${this.parent.getFullName(separator)}${separator}${this.NAME}` : this.NAME;
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
        return this.getPath('controllers');
    }

    getDefaultController () {
        return this.getController(this.config.defaultController || 'default');
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

    getController (id) {
        try {
            return require(path.join(this.getControllerDir(), `${StringHelper.idToCamel(id)}Controller`));
        } catch (e) {}
    }

    log () {
        if (this.components.logger) {
            return this.components.logger.log.apply(this.components.logger, arguments);
        }
        console.log.apply(console, arguments);
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

    afterComponentSet (cb) {
        this.triggerCallback(this.EVENT_AFTER_COMPONENT_SET, cb);
    }

    afterModuleSet (cb) {
        this.triggerCallback(this.EVENT_AFTER_MODULE_SET, cb);
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

    onAfterComponentInit (id, handler) {
        ObjectHelper.push(handler, id, this._afterComponentInitHandlers);
    }

    onAfterModuleInit (id, cb) {
        ObjectHelper.push(handler, id, this._afterModuleInitHandlers);
    }

    // EXPRESS SETUP QUEUES

    appendToExpress (method, ...args) {
        this._expressQueue.push({method, args});
    }

    assignExpressQueue () {
        for (let module of Object.values(this.modules)) {
            module.assignExpressQueue();
        }
        let fullName = this.getFullName();
        for (let item of this._expressQueue) {
            this.log('trace', `${fullName}: ${item.method}`, item.args[0]);
            this._express[item.method].apply(this._express, item.args);
        }
    }

    // CONFIG

    getConfig (key, defaults) {
        return ObjectHelper.getNestedValue(this.config, key, defaults);
    }

    setConfig (name) {
        this.configName = name;
        this.config = ObjectHelper.deepAssign(
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

    configure (parent, configName, cb) {
        this.parent = parent;
        this.app = parent ? parent.app : this;
        this.setConfig(configName);
        Object.assign(this.params, this.config.params);
        Object.assign(this.widgets, this.config.widgets);
        if (parent) {
            Object.assign(this.components, parent.components);
            ObjectHelper.deepAssignUndefined(this.params, parent.params);
            ObjectHelper.deepAssignUndefined(this.widgets, parent.widgets);
        }
        this.setMountPath();
        if (this.config.forwarder) {
            this.setForwarder(this.config.forwarder);
        }
        AsyncHelper.series([
            cb => this.beforeInit(cb),
            cb => this.setComponents(this.config.components, cb),
            cb => this.afterComponentSet(cb),
            cb => this.setModules(this.config.modules, cb),
            cb => this.afterModuleSet(cb),
            cb => {
                this.setRouter(this.config.router);
                this.setExpress();
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

    setModules (config, cb) {
        AsyncHelper.eachOfSeries(config || {}, (config, id, cb)=> {
            if (!config) {
                this.log('info', `Module '${this.getFullName()}.${id}' skipped`);
                return cb();
            }
            let configName = config.configName || this.configName;
            let module = require(this.getPath('modules', id, 'module'));
            this.modules[id] = module;
            module.configure(this, configName, err => {
                if (err) {
                    this.log('error', `Module: ${module.getFullName()}:`, err);
                    return cb();
                }
                this.log('info', `Attached module: ${module.getFullName()}`);
                AsyncHelper.eachSeries(this._afterModuleInitHandlers[id], (handler, cb)=> {
                    handler(cb, module);
                }, cb);
            });
        }, cb);
    }

    setRouter (config) {
        this.router = ClassHelper.createInstance(Object.assign({
            Class: require('../web/Router'),
            module: this
        }, config));
    }

    setExpress () {
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

    setComponents (components, cb) {
        components = components || {};
        this.extendComponentsByDefaults(components);
        AsyncHelper.eachOfSeries(components, (config, id, cb)=> {
            if (!config) {
                this.log('info', `${this.getFullName()}: Component skipped: ${id}`);
                return cb();
            }
            config.module = config.module || this;
            config.id = id;
            let name = config.setter || id;
            let method = `set${StringHelper.idToCamel(name)}Component`;
            AsyncHelper.series([
                cb => {
                    if (typeof this[method] === 'function') {
                        return this[method](id, config, cb);
                    }
                    this.createComponent(id, config);
                    cb();
                },
                cb => {
                    this.log('trace', `${this.getFullName()}: Component ready: ${id}`);
                    AsyncHelper.eachSeries(this._afterComponentInitHandlers[id], (handler, cb)=> {
                        handler(cb, this.components[id]);
                    }, cb);
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

    setAssetComponent (id, config, cb) {
        this.createComponent(id, Object.assign({
            Class: require('../web/asset/AssetManager')
        }, config));
        cb();
    }

    setBodyParserComponent (id, config, cb) {
        config = Object.assign({
            extended: true
        }, config);
        let bodyParser = require('body-parser');
        this.appendToExpress('use', bodyParser.json());
        this.appendToExpress('use', bodyParser.urlencoded(config));
        cb();
    }

    setCacheComponent (id, config, cb) {
        this.createComponent(id, Object.assign({
            Class: require('../caching/Cache')
        }, config));
        cb();
    }

    setConnectionComponent (id, config, cb) {
        this.createComponent(id, Object.assign({
            Class: require('../db/Connection')
        }, config));
        this.getDb().open(cb);
    }

    setCookieComponent (id, config, cb) {
        config = config || {};
        let cookieParser = require('cookie-parser');
        this.appendToExpress('use', cookieParser(config.secret, config.options));
        cb();
    }

    setFormatterComponent (id, config, cb) {
        this.createComponent(id, Object.assign({
            Class: require('../i18n/Formatter'),
            i18n: this.components.i18n
        }, config));
        cb();
    }

    setI18nComponent (id, config, cb) {
        this.createComponent(id, Object.assign({
            Class: require('../i18n/I18n'),
            parent: this.parent ? this.parent.components.i18n : null
        }, config));
        cb();
    }

    setLoggerComponent (id, config, cb) {
        this.createComponent(id, Object.assign({
            Class: require('../log/Logger')
        }, config)).configure(cb);
    }

    setRateLimitComponent (id, config, cb) {
        this.createComponent(id, Object.assign({
            Class: require('../web/rate-limit/RateLimit')
        }, config)).configure(cb);
    }

    setRbacComponent (id, config, cb) {
        this.createComponent(id, Object.assign({
            Class: require('../rbac/Rbac')
        }, config)).configure(cb);
    }

    setSchedulerComponent (id, config, cb) {
        this.createComponent(id, Object.assign({
            Class: require('./Scheduler')
        }, config));
        cb();
    }

    setSessionComponent (id, config, cb) {
        this.createComponent(id, Object.assign({
            Class: require('../web/session/Session')
        }, config));
        cb();
    }

    setStaticComponent (id, config, cb) {
        // use static content handlers before others
        this.app.useBaseExpressHandler(this.getRoute(), express.static(this.getPath('web')));
        cb();
    }

    setTemplateComponent (id, config, cb) {
        this.createComponent(id, Object.assign({
            Class: require('./Template'),
            parent: this.parent ? this.parent.components.template : null
        }, config)).configure(cb);
    }
    
    setViewEngineComponent (id, config, cb) {
        this.appendToExpress('engine', config.extension, config.engine);
        this.appendToExpress('set', 'view engine', config.extension);
        cb();
    }    

    setUserComponent (id, config, cb) {
        this.createComponent(id, Object.assign({
            Class: require('../web/User')
        }, config));
        this.appendToExpress('use', this.handleUser);
        cb();
    }

    // MIDDLEWARE HANDLERS

    handleModule (req, res, next) {
        res.locals.module = this; // other module middleware can get res.locals.module
        if (this.forwarder) {
            this.forwarder.forward(req);
        }
        next();
    }

    handleUser (req, res, next) {
        let module = res.locals.module;
        res.locals.user = module.components.user.createWebUser(req, res, next);
        // try to identify the user immediately, otherwise have to do a callback for isAnonymous and etc
        res.locals.user.ensureIdentity(next);
    }
};
module.exports.init();

const fs = require('fs');
const path = require('path');
const express = require('express');
const AsyncHelper = require('../helpers/AsyncHelper');
const ClassHelper = require('../helpers/ClassHelper');
const ObjectHelper = require('../helpers/ObjectHelper');
const ActionEvent = require('./ActionEvent');
const Connection = require('../db/Connection');
const Url = require('../web/Url');