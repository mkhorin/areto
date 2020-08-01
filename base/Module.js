/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Component');

module.exports = class Module extends Base {

    static getExtendedClassProperties () {
        return [
            'COMPONENT_CONFIG_MAP'
        ];
    }

    static getConstants () {
        return {
            DEFAULT_COMPONENTS: {
                'router': {},
                'urlManager': {},
                'view': {}
            },
            COMPONENT_CONFIG_MAP: {
                'asset': {Class: require('../web/asset/AssetManager')},
                'auth': {Class: require('../security/Auth')},
                'bodyParser': {
                    Class: require('../web/BodyParser'),
                    extended: true
                },
                'cache': {Class: require('../cache/Cache')},
                'cookie': {Class: require('../web/Cookie')},
                'db': {Class: require('../db/Database')},
                'filePacker': {Class: require('../web/packer/FilePacker')},
                'forwarder': {Class: require('../web/Forwarder')},
                'logger': {Class: require('../log/Logger')},
                'rateLimit': {Class: require('../security/rate-limit/RateLimit')},
                'rbac': {Class: require('../security/rbac/Rbac')},
                'router': {Class: require('../web/Router')},
                'scheduler': {Class: require('../scheduler/Scheduler')},
                'session': {Class: require('../web/session/Session')},
                'urlManager': {Class: require('../web/UrlManager')}
            },
            INHERITED_UNDEFINED_CONFIG_KEYS: [
                'params',
                'widgets'
            ],
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

    constructor (config) {
        super({
            ActionView: require('../view/ActionView'),
            ClassMapper: require('./ClassMapper'),
            Configuration: require('./Configuration'),
            DependentOrder: require('./DependentOrder'),
            Engine: require('./ExpressEngine'),
            InlineAction: require('./InlineAction'),
            ...config
        });
        this.module = this;
        this.modules = new DataMap;
        this.components = new DataMap; // all components (with inherited)
        this.ownComponents = new DataMap; // own module components
        this.app = this.parent ? this.parent.app : this;
        this.fullName = this.createFullName();
        this.relativeName = this.createRelativeName();
        this.engine = this.createEngine();
    }

    getBaseName () {
        if (!this.hasOwnProperty('_baseName')) {
            this._baseName = StringHelper.camelToId(StringHelper.trimEnd(this.constructor.name, 'Module'));
        }
        return this._baseName;
    }

    getTitle () {
        return this.config.get('title') || this.getBaseName();
    }
    
    get (id) {
        return this.components.get(id);
    }

    getParentComponent (id, defaults) {
        return this.parent ? this.parent.components.get(id) : defaults;
    }

    getDb (id) {
        return this.components.get(id || 'db');
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

    getPath () { // ignore absolute path in arguments
        return path.join(this.CLASS_DIRECTORY, ...arguments);
    }

    resolvePath () { // not ignore absolute path in arguments
        return path.resolve(this.CLASS_DIRECTORY, ...arguments);
    }

    require () {
        return this.requireInternal(...arguments) || (this.original && this.original.require(...arguments));
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

    getControllerClass (id) {
        return require(path.join(this.getControllerDirectory(), `${StringHelper.idToCamel(id)}Controller`));
    }

    getModule (name) { // name1.name2.name3
        if (typeof name !== 'string') {
            return null;
        }
        let module = this.modules.get(name);
        if (module) {
            return module;
        }
        const pos = name.indexOf('.');
        if (pos === -1) {
            return null;
        }
        module = this.modules.get(name.substring(0, pos));
        return module ? module.getModule(name.substring(pos + 1)) : null;
    }

    getModules () {
        return this.modules;
    }

    createFullName (separator = '.') { // eq - app.admin.profile
        return this.parent.createFullName(separator) + separator + this.getBaseName();
    }

    createRelativeName (separator = '.') {  // eq - admin.profile
        const parent = this.parent.createRelativeName(separator);
        return parent ? (parent + separator + this.getBaseName()) : this.getBaseName();
    }

    log () {
        CommonHelper.log(this.components.get('logger'), this.relativeName, ...arguments);
    }

    translate (message, params, source = 'app') {
        const i18n = this.components.get('i18n');
        return i18n ? i18n.translateMessage(message, params, source) : message;
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
        await this.beforeInit();
        await this.createOrigin();
        await this.createConfiguration();
        await this.createClassMapper();
        this.extractConfigProperties();
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

    async createOrigin () {
        if (this.original) {
            this.original = this.spawn(this.original, {parent: this.parent});
            await this.original.createConfiguration();
            await this.original.createClassMapper();
            this.original.extractConfigProperties();
        }
    }

    async createConfiguration () {
        this.config = this.spawn(this.Configuration, {
            directory: this.getPath('config'),
            name: this.configName,
            parent: this.parent && this.parent.config,
            original: this.original && this.original.config,
            data: this.config
        });
        await this.config.load();
        this.config.inheritUndefined(this.INHERITED_UNDEFINED_CONFIG_KEYS);
    }

    extractConfigProperties () {
        const params = this.getConfig('params') || {};
        this.params = Object.assign(params, this.params);
    }

    setMountPath () {
        this.mountPath = this.getConfig('mountPath', this.parent ? `/${this.getBaseName()}` : '/');
    }

    async createClassMapper () {
        this.classMapper = this.spawn(this.ClassMapper);
        await this.classMapper.init();
    }

    // MODULES

    async initModules (data = {}) {
        for (const key of Object.keys(data)) {
            await this.initModule(key, data[key]);
        }
    }

    initModule (id, config) {
        if (!config) {
            return this.log('info', `Module skipped: ${id}`);
        }
        if (!config.Class) {
            config.Class = this.require('module', id, 'Module.js');
        }
        const module = ClassHelper.spawn(config, {parent: this});
        this.modules.set(id, module);
        return module.init();
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
            ...this.COMPONENT_CONFIG_MAP[id],
            ...config
        };
        config.id = id;
        config.parent = this.getParentComponent(id);
        const name = StringHelper.idToCamel(config.componentMethodName || config.id);
        const method = `create${name}Component`;
        return typeof this[method] === 'function'
            ? this[method](config)
            : this.spawn(config);
    }

    createFormatterComponent (config) {
        return this.spawn({
            Class: require('../i18n/Formatter'),
            i18n: this.components.get('i18n'),
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
            original: this.original && this.original.createViewComponent(config),
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
        const name = StringHelper.idToCamel(component.componentMethodName || component.id);
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

    addViewEngine (data) {
        this.engine.addViewEngine(data);
    }

    attachStaticSource (data) {
        if (data) {
            this.attachStaticByModule(this, data);
            if (this.original) {
                this.attachStaticByModule(this.original, data);
            }
        }
    }

    attachStaticByModule (module, {options}) {
        const web = module.getPath('web');
        if (fs.existsSync(web)) {
            // use static content handlers before others
            this.app.mainEngine.attachStatic(this.getRoute(), web, options);
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