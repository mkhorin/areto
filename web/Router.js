/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class Router extends Base {

    constructor (config) {
        super({
            depends: '#end',
            defaultController: 'default',
            ...config
        });
    }

    init () {
        this.createControllerMap();
        this.addDefaultAction(this.getDefaultController());
        this.addActions();
        this.module.on(this.module.EVENT_AFTER_MODULE_INIT, this.afterModuleInit.bind(this));
    }

    afterModuleInit () {
        if (this.errors) {
            this.addErrorHandlers(this.errors);
        }
    }

    // CONTROLLER

    createControllerMap () {
        this._controllerMap = this.getControllerMap(this.module.getControllerDir());
        if (this.module.origin) {
            this._controllerMap = {
                ...this.getControllerMap(this.module.origin.getControllerDir()),
                ...this._controllerMap
            };
        }
    }

    getDefaultController () {
        return this.getController(this.defaultController);
    }

    getController (id) {
        return this._controllerMap.hasOwnProperty(id) ? this._controllerMap[id] : null;
    }

    getControllerMap (dir, relative = '') {
        let files = [];
        try {
            files = fs.readdirSync(dir);
        } catch (err) {
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
            Object.assign(map, this.getControllerMap(file, `${relative}${path.basename(file)}/`));
        } else {
            file = require(file);
            map[relative + file.NAME] = file;
        }
    }

    resolveControllerId (id) {
        return id.replace(/\//g, '-');
    }

    createController (Controller, config) {
        config.user = config.res.locals.user;
        config.language = config.res.locals.language;
        return new Controller(config);
    }

    // ACTION

    addDefaultAction (Controller) {
        if (Controller && Controller.DEFAULT_ACTION) {
            if (Controller.getActionKeys().includes(Controller.DEFAULT_ACTION)) {
                this.addAction(Controller.DEFAULT_ACTION, Controller, '');
            }
        }
    }

    addActions () {
        for (const id of Object.keys(this._controllerMap)) {
            const route = `/${this.resolveControllerId(id)}`;
            const Controller = this._controllerMap[id];
            for (const actionId of Controller.getActionKeys()) {
                this.addAction(actionId, Controller, `${route}/${actionId}`);
                if (Controller.DEFAULT_ACTION === actionId) {
                    this.addAction(actionId, Controller, route);
                }
            }
        }
    }

    addAction (id, Controller, route) {
        const action = (req, res, next)=> {
            this.createController(Controller, {
                req,
                res,
                module: res.locals.module
            }).execute(id).catch(next);
        };
        let methods = Controller.METHODS[id] || ['all'];
        if (!Array.isArray(methods)) {
            methods = [methods];
        }
        for (const method of methods) {
            this.module.addHandler(method.toLowerCase(), route, action);
        }
    }

    addErrorHandlers (config) {
        const Controller = this.getController(config.controller) || this.getDefaultController();
        this.module.addHandler('all', '*', (req, res, next)=> next(new NotFound));
        this.module.addHandler('use', (err, req, res, next)=> {
            if (!(err instanceof HttpException)) {
                err = new ServerError(err);
            }
            err.setParams(req, res);
            if (!Controller) {
                return next(err);
            }
            this.createController(Controller, {
                err,
                req,
                res,
                module: this.module
            }).execute(config.action || 'error').catch(next);
        });
    }
};

const fs = require('fs');
const path = require('path');
const HttpException = require('../error/HttpException');
const NotFound = require('../error/NotFoundHttpException');
const ServerError = require('../error/ServerErrorHttpException');