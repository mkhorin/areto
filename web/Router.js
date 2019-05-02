/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class Router extends Base {

    constructor (config) {
        super({
            'depends': '#end',
            'defaultController': 'default',
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
        let map = {};
        for (let file of files) {
            this.setControllerMapFile(path.join(dir, file), relative, map);
        }
        return map;
    }

    setControllerMapFile (file, relative, map) {
        let stat = fs.lstatSync(file);
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

    // ACTION

    addDefaultAction (Controller) {
        if (Controller && Controller.DEFAULT_ACTION) {
            if (Controller.getActionKeys().includes(Controller.DEFAULT_ACTION)) {
                this.addAction(Controller.DEFAULT_ACTION, Controller, '');
            }
        }
    }

    addActions () {
        for (let id of Object.keys(this._controllerMap)) {
            let route = `/${this.resolveControllerId(id)}`;
            let Controller = this._controllerMap[id];
            for (let actionId of Controller.getActionKeys()) {
                this.addAction(actionId, Controller, `${route}/${actionId}`);
                if (Controller.DEFAULT_ACTION === actionId) {
                    this.addAction(actionId, Controller, route);
                }
            }
        }
    }

    addAction (id, Controller, route) {
        let action = function (req, res, next) {
            (new Controller({
                'req': req,
                'res': res,
                'module': res.locals.module,
                'user': res.locals.user,
                'language': res.locals.language
            })).execute(id).catch(next);
        };
        let methods = Controller.METHODS[id] || ['all'];
        if (!Array.isArray(methods)) {
            methods = [methods];
        }
        for (let method of methods) {
            this.module.addHandler(method.toLowerCase(), route, action);
        }
    }

    // ERROR

    addErrorHandlers (config) {
        this.module.addHandler('all', '*', function (req, res, next) {
            next(new NotFound);
        });
        let Controller = this.getController(config.controller) || this.getDefaultController();
        this.module.addHandler('use', (err, req, res, next)=> {
            if (!(err instanceof HttpException)) {
                err = new ServerError(err);
            }
            err.setParams(req, res);
            if (!Controller) {
                return next(err);
            }
            let controller= new Controller({
                'req': req,
                'res': res,
                'err': err,
                'module': this.module,
                'user': res.locals.user,
                'language': res.locals.language
            });
            controller.execute(config.action || 'error').catch(next);
        });
    }
};

const fs = require('fs');
const path = require('path');
const HttpException = require('../error/HttpException');
const NotFound = require('../error/NotFoundHttpException');
const ServerError = require('../error/ServerErrorHttpException');