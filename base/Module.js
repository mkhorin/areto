/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Component');
const StringHelper = require('../helper/StringHelper');

module.exports = class Module extends Base {

    static getExtendedClassProps () {
        return [
            'COMPONENT_CONFIG'
        ];
    }

    static getConstants () {
        return {
            NAME: this.getName(),
            DEFAULT_COMPONENTS: {
                'router': {},
                'view': {}
            },
            COMPONENT_CONFIG: {
                'asset': {
                    Class: require('../web/asset/AssetManager')
                },
                'bodyParser': {
                    Class: require('../web/BodyParser'),
                    extended: true
                },
                'cache': {
                    Class: require('../cache/Cache')
                },
                'connection': {
                    Class: require('../db/Connection')
                },
                'cookie': {
                    Class: require('../web/Cookie')
                },
                'forwarder': {
                    Class: require('../web/Forwarder'),
                },
                'logger': {
                    Class: require('../log/Logger')
                },
                'rateLimit': {
                    Class: require('../web/rate-limit/RateLimit')
                },
                'rbac': {
                    Class: require('../rbac/Rbac')
                },
                'router': {
                    Class: require('../web/Router')
                },
                'scheduler': {
                    Class: require('../scheduler/Scheduler')
                },
                'session': {
                    Class: require('../web/session/Session')
                },
                'user': {
                    Class: require('../web/User')
                }
            },
            FORWARDER_COMPONENT: 'forwarder',
            EVENT_BEFORE_INIT: 'beforeInit',
            EVENT_BEFORE_COMPONENT_INIT: 'beforeComponentInit',
            EVENT_AFTER_COMPONENT_INIT: 'afterComponentInit',
            EVENT_AFTER_MODULE_INIT: 'afterModuleInit',
            EVENT_AFTER_INIT: 'afterInit',
            EVENT_BEFORE_ACTION: 'beforeAction',
            EVENT_AFTER_ACTION: 'afterAction',
            VIEW_LAYOUT: 'default' // default template layout
        };
    }

    static getName () {
        return StringHelper.camelToId(this.name);
    }

    constructor (config) {
        super({
            'ActionView': require('../view/ActionView'),
            'Configuration':  require('./Configuration'),
            'DependentOrder':  require('./DependentOrder'),
            'Express': require('./Express'),
            'InlineAction': require('./InlineAction'),
            ...config
        });
        this.modules = new DataMap;
        this.components = new DataMap; // all components (with inherited)
        this.moduleComponents = new DataMap; // own module components
        this.params = {}; // inherited from parent
        this.widgets = {}; // inherited from parent
        this.express = this.createExpress();
        this.setParent();
    }

    get (id) {
        return this.components.get(id);
    }

    getParentComponent (id, defaults) {
        return this.parent ? this.parent.components.get(id) : defaults;
    }

    getDb (id = 'connection') {
        let connection = this.components.get(id);
        return connection && connection.driver;
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

    getPath (...args) {
        return path.join.apply(path, [path.dirname(this.CLASS_FILE)].concat(args));
    }

    require (...args) {
        return require(this.getPath.apply(this, args));
    }

    getRelativePath (file) {
        return file.substring(this.getPath().length + 1);
    }

    getControllerDir () {
        return this.getPath('controller');
    }

    getControllerClass (id) {
        return require(path.join(this.getControllerDir(), `${StringHelper.idToCamel(id)}Controller`));
    }

    getModule (name) { // name1.name2.name3
        if (typeof name !== 'string') {
            return null;
        }
        let module = this.modules.get(name);
        if (module) {
            return module;
        }
        let pos = name.indexOf('.');
        if (pos === -1) {
            return null;
        }
        module = this.modules.get(name.substring(0, pos));
        return module ? module.getModule(name.substring(pos + 1)) : null;
    }

    setParent () {
        this.parent = ClassHelper.getParentModule(this);
        this.app = this.parent.app;
    }

    log (type, message, data) {
        CommonHelper.log(type, message, data, this.getFullName(), this.components.get('logger'));
    }

    translate (message) {
        let i18n = this.components.get('i18n');
        return i18n ? i18n.translateMessage.apply(this, arguments) : message;
    }

    // ROUTE

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

    getHomeUrl () {
        return this.params.homeUrl || '/';
    }

    resolveUrl (url) {
        return this.forwarder ? this.forwarder.resolveUrl(url) : url;
    }

    // EVENTS

    beforeInit () {
        return this.trigger(this.EVENT_BEFORE_INIT);
    }

    beforeComponentInit () {
        return this.trigger(this.EVENT_BEFORE_COMPONENT_INIT);
    }

    afterComponentInit () {
        this.forwarder = this.components.get(this.FORWARDER_COMPONENT);
        return this.trigger(this.EVENT_AFTER_COMPONENT_INIT);
    }

    afterModuleInit () {
        return this.trigger(this.EVENT_AFTER_MODULE_INIT);
    }

    afterInit () {
        return this.trigger(this.EVENT_AFTER_INIT);
    }

    beforeAction (action) {
        return this.trigger(this.EVENT_BEFORE_ACTION, new ActionEvent(action));
    }

    afterAction (action) {
        return this.trigger(this.EVENT_AFTER_ACTION, new ActionEvent(action));
    }

    // INIT

    async init (config) {
        Object.assign(this, config);
        await this.beforeInit();
        await this.createConfiguration();
        this.assignParams();
        this.setMountPath();
        this.attachStaticSource(this.getParam('static'));
        this.addViewEngine(this.getParam('template'));
        this.createComponents(this.getConfig('components'));
        await this.beforeComponentInit();
        await this.initComponents();
        await this.afterComponentInit();
        await this.initModules(this.getConfig('modules'));
        await this.afterModuleInit();
        this.attachModule();
        await this.afterInit();
        this.log('info', `Configured as ${this.config.getTitle()}`);
    }

    createConfiguration () {
        this.config = ClassHelper.createInstance(this.Configuration, {
            'module': this,
            'dir': this.getPath('config'),
            'name': this.configName
        });
        return this.config.load();
    }

    assignParams () {
        Object.assign(this.params, this.getConfig('params'));
        Object.assign(this.widgets, this.getConfig('widgets'));
        if (this.parent) {
            AssignHelper.deepAssignUndefined(this.params, this.parent.params);
            AssignHelper.deepAssignUndefined(this.widgets, this.parent.widgets);
        }
    }

    setMountPath () {
        this.mountPath = this.getConfig('mountPath', this.parent ? `/${this.NAME}` : '/');
    }

    // MODULES

    async initModules (data = {}) {
        for (let key of Object.keys(data)) {
            await this.initModule(key, data[key]);
        }
    }

    initModule (id, config) {
        if (!config) {
            return this.log('info', `Module skipped: ${id}`);
        }
        let module = require(this.getPath('module', id, 'module'));
        this.modules.set(id, module);
        return module.init(config);
    }

    // COMPONENTS

    deepAssignComponent (name, newComponent) {
        let currentComponent = this.components.get(name);
        for (let module of this.modules) {
            if (module.components.get(name) === currentComponent) {
                module.deepAssignComponent(name, newComponent);
            }
        }
        this.components.set(name, newComponent);
    }

    createComponents (data = {}) {
        if (this.parent) {
            this.components.assign(this.parent.components); // inherit from parent
        }
        AssignHelper.assignUndefined(data, this.DEFAULT_COMPONENTS);
        for (let id of Object.keys(data)) {
            let component = this.createComponent(id, data[id]);
            if (component) {
                this.moduleComponents.set(id, component);
                this.components.set(id, component);
            }
        }
    }

    createComponent (id, config) {
        if (!config) {
            return this.log('info', `Component skipped: ${id}`);
        }
        config = {
            ...this.COMPONENT_CONFIG[id],
            ...config
        };
        config.module = config.module || this;
        config.id = id;
        let name = StringHelper.idToCamel(config.componentMethodName || config.id);
        let method = `create${name}Component`;
        return typeof this[method] === 'function'
            ? this[method](config)
            : ClassHelper.createInstance(config);
    }

    createFormatterComponent (config) {
        return ClassHelper.createInstance({
            'Class': require('../i18n/Formatter'),
            'i18n': this.components.get('i18n'),
            ...config
        });
    }

    createI18nComponent (config) {
        return ClassHelper.createInstance({
            'Class': require('../i18n/I18n'),
            'parent': this.getParentComponent(config.id),
            ...config
        });
    }

    createViewComponent (config) {
        return ClassHelper.createInstance({
            'Class': require('../view/View'),
            'parent': this.getParentComponent(config.id),
            ...config
        });
    }

    // INIT COMPONENT

    async initComponents () {
        for (let component of this.orderComponents()) {
            await this.initComponent(component);
        }
    }

    orderComponents () {
        return ClassHelper.createInstance(this.DependentOrder).sort(this.moduleComponents.values());
    }

    async initComponent (component) {
        let name = StringHelper.idToCamel(component.componentMethodName || component.id);
        let method = `init${name}Component`;
        if (typeof this[method] === 'function') {
            await this[method](component);
        } else if (typeof component.init === 'function') {
            await component.init();
        }
    }

    async initConnectionComponent (component) {
        await component.init();
        await this.getDb(component.id).open();
    }

    // EXPRESS

    createExpress (params) {
        return ClassHelper.createInstance(this.Express, {
            'module': this,
            ...params
        });
    }

    addHandler () {
        this.express.add.apply(this.express, arguments);
    }

    addViewEngine (data) {
        this.express.addViewEngine(data);
    }

    attachStaticSource (data) {
        if (data) {
            let dir = this.getPath(data.dir || 'web');
            if (fs.existsSync(dir)) {
                // use static content handlers before others
                this.app.mainExpress.attachStatic(this.getRoute(), dir, data.options);
            }
        }
    }

    attachHandlers () {
        for (let module of this.modules) {
            module.attachHandlers();
        }
        this.express.attachHandlers();
    }

    attachModule () {
        if (this.parent) {
            this.parent.express.addChild(this.mountPath, this.express);
        }
        this.express.attach('use', this.handleModule.bind(this));
    }

    // MIDDLEWARE

    handleModule (req, res, next) {
        res.locals.module = this;
        next();
    }
};
module.exports.init();

const fs = require('fs');
const path = require('path');
const ClassHelper = require('../helper/ClassHelper');
const CommonHelper = require('../helper/CommonHelper');
const ObjectHelper = require('../helper/ObjectHelper');
const AssignHelper = require('../helper/AssignHelper');
const ActionEvent = require('./ActionEvent');
const DataMap = require('./DataMap');