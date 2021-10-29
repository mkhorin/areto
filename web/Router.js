/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class Router extends Base {

    static createActionRouteName (name) {
        return StringHelper.camelToKebab(name);
    }

    /**
     * @param {Object} config
     * @param {string} config.defaultModule - Default module name
     */
    constructor (config) {
        super({
            depends: '#end',
            defaultController: 'default',
            ...config
        });
    }

    init () {
        this.createControllerMap();
        this.addActions();
        this.module.on(this.module.EVENT_AFTER_MODULE_INIT, this.afterModuleInit.bind(this));
    }

    afterModuleInit () {
        this.defaultModule
            ? this.addDefaultModule(this.defaultModule)
            : this.addDefaultAction(this.getDefaultController());
        if (this.errors) {
            this.addErrorHandlers(this.errors);
        }
    }

    addDefaultModule (name) {
        const module = this.module.getModule(name);
        if (!module) {
            return this.log('error', `Module not found: ${name}`);
        }
        const url = module.get('urlManager').resolve('');
        this.module.addHandler(['all'], '', (req, res) => res.redirect(url));
    }

    // CONTROLLER

    createControllerMap () {
        this._controllerMap = this.getInheritedControllerMap(this.module);
    }

    getInheritedControllerMap (module) {
        if (!module.original) {
            return this.getControllerMap(module.getControllerDirectory());
        }
        return {
            ...this.getInheritedControllerMap(module.original),
            ...this.getControllerMap(module.getControllerDirectory())
        };
    }

    getDefaultController () {
        return this.getController(this.defaultController);
    }

    getController (name) {
        return this._controllerMap.hasOwnProperty(name) ? this._controllerMap[name] : null;
    }

    getControllerMap (dir, relative = '') {
        let files = [];
        try {
            files = fs.readdirSync(dir);
        } catch {
        }
        const result = {};
        for (const file of files) {
            this.setControllerMapFile(path.join(dir, file), relative, result);
        }
        return result;
    }

    setControllerMapFile (file, relative, map) {
        const stat = fs.lstatSync(file);
        if (stat.isDirectory()) {
            Object.assign(map, this.getControllerMap(file, `${relative}${path.basename(file)}-`));
        } else {
            const controller = require(file);
            map[relative + controller.getRouteName()] = controller;
        }
    }

    createController (Controller, config) {
        config.user = config.res.locals.user;
        config.language = config.res.locals.language;
        return new Controller(config);
    }

    // ACTION

    addDefaultAction (Controller) {
        if (Controller?.DEFAULT_ACTION) {
            if (Controller.getActionNames().includes(Controller.DEFAULT_ACTION)) {
                this.addAction(Controller.DEFAULT_ACTION, Controller, '');
            }
        }
    }

    addActions () {
        for (const key of Object.keys(this._controllerMap)) {
            const route = `/${key}`;
            const Controller = this._controllerMap[key];
            for (const name of Controller.getActionNames()) {
                this.addAction(name, Controller, `${route}/${this.constructor.createActionRouteName(name)}`);
                if (Controller.DEFAULT_ACTION === name) {
                    this.addAction(name, Controller, route);
                }
            }
        }
    }

    addAction (name, Controller, route) {
        const action = (req, res, next) => {
            this.createController(Controller, {req, res, module: res.locals.module})
                .execute(name)
                .catch(next);
        };
        let methods = Controller.METHODS[name] || Controller.METHODS['*'] || ['all'];
        if (!Array.isArray(methods)) {
            methods = [methods];
        }
        for (const method of methods) {
            this.module.addHandler(method.toLowerCase(), route, action);
        }
    }

    addErrorHandlers (config) {
        const Controller = this.getController(config.controller) || this.getDefaultController();
        this.module.addHandler('all', '*', (req, res, next) => next(new NotFound));
        this.module.addHandler('use', (err, req, res, next) => {
            if (!(err instanceof HttpException)) {
                err = new ServerError(err);
            }
            err.setParams(req, res);
            if (!Controller) {
                return next(err);
            }
            this.createController(Controller, {err, req, res, module: this.module})
                .execute(config.action || 'error')
                .catch(next);
        });
    }
};

const HttpException = require('../error/HttpException');
const NotFound = require('../error/http/NotFound');
const ServerError = require('../error/http/ServerError');
const StringHelper = require('../helper/StringHelper');
const fs = require('fs');
const path = require('path');