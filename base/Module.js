/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Component');

module.exports = class Module extends Base {

    static getExtendedClassProperties () {
        return [
            'COMPONENT_CONFIGURATIONS'
        ];
    }

    static getConstants () {
        return {
            DEFAULT_COMPONENTS: {
                'router': {},
                'urlManager': {},
                'view': {}
            },
            COMPONENT_CONFIGURATIONS: {
                'asset': {
                    Class: require('../web/asset/AssetManager')
                },
                'auth': {
                    Class: require('../security/Auth')
                },
                'bodyParser': {
                    Class: require('../web/BodyParser')
                },
                'cache': {
                    Class: require('../cache/Cache')
                },
                'cookie': {
                    Class: require('../web/Cookie')
                },
                'db': {
                    Class: require('../db/Database')
                },
                'filePacker': {
                    Class: require('../web/packer/FilePacker')
                },
                'forwarder': {
                    Class: require('../web/Forwarder')
                },
                'logger': {
                    Class: require('../log/Logger')
                },
                'rateLimit': {
                    Class: require('../security/rateLimit/RateLimit')
                },
                'rbac': {
                    Class: require('../security/rbac/Rbac')
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
                'urlManager': {
                    Class: require('../web/UrlManager')
                }
            },
            INHERITED_UNDEFINED_CONFIGURATION_KEYS: [
                'params',
                'widgets'
            ],
            EVENT_BEFORE_INIT: 'beforeInit',
            EVENT_BEFORE_COMPONENT_INIT: 'beforeComponentInit',
            EVENT_AFTER_COMPONENT_INIT: 'afterComponentInit',
            EVENT_AFTER_MODULE_INIT: 'afterModuleInit',
            EVENT_AFTER_INIT: 'afterInit',
            EVENT_BEFORE_ACTION: 'beforeAction',
            EVENT_AFTER_ACTION: 'afterAction'
        };
    }

    constructor (config) {
        super({
            ActionView: require('../view/ActionView'),
            ClassMapper: require('./ClassMapper'),
            Configuration: require('./Configuration'),
            DependentOrder: require('./DependentOrder'),
            Engine: require('./ExpressEngine'),
            InlineAction: require('./InlineAction'),
            defaultDbComponentId: 'db',
            defaultFormatterComponentId: 'formatter',
            defaultI18nComponentId: 'i18n',
            defaultUrlManagerComponentId: 'urlManager',
            defaultViewComponentId: 'view',
            defaultViewLayout: 'default',
            ...config
        });
        this.module = this;
        this.modules = new DataMap;
        this.components = new DataMap; // all components (with inherited)
        this.ownComponents = new DataMap; // own module components
        this.app = this.parent ? this.parent.app : this;
        this.engine = this.createEngine();
        this.name = this.createName();
        this._routeName = this.createRouteName();
        this._fullName = this.createFullName();
        this._internalName = this.createInternalName();
    }

    getFullName () {
        return this._fullName;
    }

    getInternalName () {
        return this._internalName;
    }

    getRouteName () {
        return this._routeName;
    }

    getTitle () {
        return this.config.get('title') || this.name;
    }

    get (id) {
        return this.components.get(id);
    }

    getDb (id) {
        return this.components.get(id || this.defaultDbComponentId);
    }

    getClass () {
        return this.classMapper.get(...arguments);
    }

    getConfig () {
        return this.config.get(...arguments);
    }

    getParam (key, defaults) {
        return NestedHelper.get(key, this.params, defaults);
    }

    /**
     * Get path relative to module (ignore absolute path in arguments)
     * @returns {string}
     */
    getPath () {
        return path.join(this.CLASS_DIRECTORY, ...arguments);
    }

    /**
     * Get path relative to module (not ignore absolute path in arguments)
     * @returns {string}
     */
    resolvePath () {
        return path.resolve(this.CLASS_DIRECTORY, ...arguments);
    }

    require () {
        return this.requireInternal(...arguments) || this.original?.require(...arguments);
    }

    requireInternal () {
        const file = FileHelper.addExtension('js', this.resolvePath(...arguments));
        if (fs.existsSync(file)) {
            return require(file);
        }
    }

    getRelativePath (file) {
        return FileHelper.getRelativePath(this.CLASS_DIRECTORY, file);
    }

    getControllerDirectory () {
        return this.getPath('controller');
    }

    /**
     * Get descendant module by internal name: module1.module2.module3
     * @param {string} name
     */
    getModule (name) {
        if (typeof name !== 'string') {
            return null;
        }
        let module = this.modules.get(name);
        if (module) {
            return module;
        }
        const pos = name.indexOf('.');
        if (pos !== -1) {
            return this.modules.get(name.substring(0, pos))?.getModule(name.substring(pos + 1));
        }
    }

    createName () {
        return this.name;
    }

    /**
     * Get full module name (eg. app.admin.profile)
     * @param {string} [separator]
     */
    createFullName (separator = '.') {
        return this.parent.createFullName(separator) + separator + this.name;
    }

    /**
     * Get module name relative to app (eg. admin.profile)
     * @param {string} [separator]
     */
    createInternalName (separator = '.') {
        const name = this.createFullName(separator);
        return name.substring(name.indexOf(separator) + 1);
    }

    createRouteName () {
        return StringHelper.camelToKebab(this.name);
    }

    log () {
        CommonHelper.log(this.components.get('logger'), this._internalName, ...arguments);
    }

    translate (message, params, source = 'app') {
        const i18n = this.module.components.get(this.defaultI18nComponentId);
        return i18n
            ? i18n.translateMessage(message, params, source)
            : message;
    }

    // ROUTE

    getHomeUrl () {
        return this.params.homeUrl || '/';
    }

    getRoute (url) {
        if (this._route === undefined) {
            this._route = this.parent.getRoute() + this.mountPath;
        }
        return url ? `${this._route}/${url}` : this._route;
    }

    getRouteModules () {
        if (!this._routeModules) {
            this._routeModules = Object.freeze(this.resolveRouteModules());
        }
        return this._routeModules;
    }

    resolveRouteModules () {
        let modules = [this];
        let current = this;
        while (current.parent) {
            current = current.parent;
            modules.push(current);
        }
        return modules;
    }

    // EVENTS

    beforeInit () {
        return this.trigger(this.EVENT_BEFORE_INIT);
    }

    beforeComponentInit () {
        return this.trigger(this.EVENT_BEFORE_COMPONENT_INIT);
    }

    afterComponentInit () {
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

    async init () {
        await this.engine.init();
        await this.beforeInit();
        await this.createOriginalModule();
        await this.createConfiguration();
        await this.createClassMapper();
        this.extractConfigurationProperties();
        this.setMountPath();
        this.attachStaticSource(this.getParam('static'));
        this.addViewEngine(this.getParam('template'));
        this.createComponents(this.getConfig('components'));
        this.createModules(this.getConfig('modules'));
        await this.beforeComponentInit();
        await this.initComponents();
        await this.afterComponentInit();
        await this.initModules();
        await this.afterModuleInit();
        this.attachModule();
        await this.afterInit();
        this.log('info', `Configured as ${this.config.getTitle()}`);
    }

    async createOriginalModule () {
        if (this.original) {
            this.original = this.spawn(this.original, this.getOriginalSpawnParams());
            await this.original.initOriginalModule(this);
        }
    }

    getOriginalSpawnParams () {
        return {
            configName: this.configName,
            name: this.name,
            parent: this.parent
        };
    }

    async initOriginalModule () {
        await this.createOriginalModule();
        await this.createConfiguration();
        await this.createClassMapper();
        this.extractConfigurationProperties();
    }

    getOriginalHierarchy () {
        let modules = [this];
        let current = this;
        while (current.original) {
            current = current.original;
            modules.push(current);
        }
        return modules.reverse();
    }

    async createConfiguration () {
        this.config = this.spawn(this.Configuration, {
            directory: this.getPath('config'),
            name: this.configName,
            parent: this.parent?.config,
            original: this.original?.config,
            data: this.config
        });
        await this.config.load();
        this.config.inheritUndefined(this.INHERITED_UNDEFINED_CONFIGURATION_KEYS);
    }

    extractConfigurationProperties () {
        const data = this.getConfig('params') || {};
        this.params = Object.assign(data, this.params);
    }

    setMountPath (value) {
        this.mountPath = value || this.resolveMountPath();
        this.original?.setMountPath(this.mountPath);
    }

    resolveMountPath () {
        const defaults = this.parent ? `/${this.getRouteName()}` : '/';
        return this.getConfig('mountPath', defaults);
    }

    async createClassMapper () {
        this.classMapper = this.spawn(this.ClassMapper);
        await this.classMapper.init();
    }

    // MODULES

    createModules (data = {}) {
        for (const name of Object.keys(data)) {
            this.createModule(name, data[name]);
        }
    }

    createModule (name, config) {
        if (!config) {
            return this.log('info', `Module skipped: ${name}`);
        }
        if (!config.Class) {
            config.Class = this.require('module', name, 'Module.js');
        }
        const module = ClassHelper.spawn(config, this.getModuleSpawnParams(name));
        this.modules.set(name, module);
    }

    getModuleSpawnParams (name) {
        return {
            configName: this.configName,
            name,
            parent: this
        };
    }

    async initModules () {
        for (const module of this.modules) {
            await module.init();
        }
    }

    // COMPONENTS

    deepAssignComponent (name, newComponent) {
        const currentComponent = this.components.get(name);
        for (const module of this.modules) {
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
        for (const id of Object.keys(data)) {
            this.log('trace', `Create component: ${id}`);
            const component = this.createComponent(id, data[id]);
            if (component) {
                this.ownComponents.set(id, component);
                this.components.set(id, component); // with inherited components
            }
        }
    }

    createComponent (id, config) {
        if (!config) {
            return this.log('info', `Component skipped: ${id}`);
        }
        config = {
            ...this.COMPONENT_CONFIGURATIONS[id],
            ...config
        };
        config.id = id;
        config.parent = this.parent?.components.get(id);
        const name = StringHelper.capitalize(config.componentMethodName || config.id);
        const method = `create${name}Component`;
        return typeof this[method] === 'function'
            ? this[method](config)
            : this.spawn(config);
    }

    createFormatterComponent (config) {
        return this.spawn({
            Class: require('../i18n/Formatter'),
            i18n: this.defaultI18nComponentId,
            ...config
        });
    }

    createI18nComponent (config) {
        return this.spawn({
            Class: require('../i18n/I18n'),
            ...config
        });
    }

    createViewComponent (config) {        
        return this.spawn({
            Class: require('../view/View'),
            original: this.original?.createViewComponent(config),
            ...config
        });
    }

    // INIT COMPONENT

    async initComponents () {
        for (const component of this.sortComponents()) {
            await this.initComponent(component);
        }
    }

    sortComponents () {
        return this.spawn(this.DependentOrder).sort(this.ownComponents.values());
    }

    async initComponent (component) {
        const name = StringHelper.capitalize(component.componentMethodName || component.id);
        const method = `init${name}Component`;
        if (typeof this[method] === 'function') {
            await this[method](component);
        } else if (typeof component.init === 'function') {
            await component.init();
        }
    }

    // ENGINE

    createEngine (params) {
        return this.spawn(this.Engine, params);
    }

    addHandler () {
        this.engine.add(...arguments);
    }

    addViewEngine (params) {
        this.engine.addViewEngine(params);
    }

    attachStaticSource (params) {
        if (params) {
            this.attachModuleStaticSource(this, params.options);
        }
    }

    attachModuleStaticSource (module, options) {
        this.app.attachStaticDirectory(this.getRoute(), module.getPath('web'), options);
        if (module.original) {
            this.attachModuleStaticSource(module.original, options);
        }
    }

    attachStaticDirectory (route, dir, options = this.getParam('static')?.options) {
        if (fs.existsSync(dir)) {
            // attach static content handlers before others
            this.app.appEngine.attachStatic(route, dir, options);
        }
    }

    attachHandlers () {
        for (const module of this.modules) {
            module.attachHandlers();
        }
        this.engine.attachHandlers();
    }

    attachModule () {
        if (this.parent) {
            this.parent.engine.addChild(this.mountPath, this.engine);
        }
        this.engine.attach('use', this.handleModule.bind(this));
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
const AssignHelper = require('../helper/AssignHelper');
const ClassHelper = require('../helper/ClassHelper');
const CommonHelper = require('../helper/CommonHelper');
const FileHelper = require('../helper/FileHelper');
const NestedHelper = require('../helper/NestedHelper');
const StringHelper = require('../helper/StringHelper');
const ActionEvent = require('./ActionEvent');
const DataMap = require('./DataMap');