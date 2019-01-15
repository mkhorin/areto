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
        this.addDefaultAction();
        this.addDir(this.module.getControllerDir());
        if (this.errors) {
            this.module.on(this.module.EVENT_AFTER_MODULE_INIT, this.addErrorHandlers.bind(this, this.errors));
        }
    }

    attach (Controller) {
        let controller = new Controller;
        let route = `/${Controller.NAME}`;
        for (let id of controller.getActionIds()) {
            this.addAction(id, controller, `${route}/${id}`);
            if (controller.DEFAULT_ACTION === id) {
                this.addAction(id, controller, route);
            }
        }
    }

    addDefaultAction (Controller) {
        if (Controller === undefined) {
            try {
                Controller = this.getDefaultController();
            } catch (err) {
            }
        }
        if (Controller && Controller.DEFAULT_ACTION) {
            let controller = new Controller;
            let id = Controller.DEFAULT_ACTION;
            if (controller.getActionIds().includes(id)) {
                this.addAction(id, controller, '');
            }
        }
    }

    addDir (dir) {
        let files = [];
        try {
            files = fs.readdirSync(dir);
        } catch (err) {
        }
        for (let file of files) {
            this.addFile(path.join(dir, file));
        }
    }

    addFile (file) {
        let stat = fs.lstatSync(file);
        if (stat.isDirectory()) {
            return this.addDir(file);
        }
        this.attach(require(file));
    }

    addAction (id, controller, route) {
        let action = function (req, res, next) {
            (new controller.constructor).assign(req, res).execute(id).catch(next);
        };
        let methods = controller.METHODS[id] || ['all'];
        if (!(methods instanceof Array)) {
            methods = [methods];
        }
        for (let method of methods) {
            this.module.addHandler(method.toLowerCase(), route, action);
        }
    }

    addErrorHandlers (config) {
        this.module.addHandler('all', '*', function (req, res, next) {
            next(new NotFound);
        });
        let Controller = config.Controller || this.getDefaultController();
        this.module.addHandler('use', function (err, req, res, next) {
            if (!(err instanceof HttpException)) {
                err =  new ServerError(err);
            }
            err.setParams(req, res);
            if (!Controller) {
                return next(err);
            }
            let action = config.action || 'error';
            let controller = ClassHelper.createInstance(Controller);
            controller.assign(req, res, err).execute(action).catch(next);
        });
    }

    getDefaultController () {
        return this.module.getControllerClass(this.defaultController);
    }
};

const fs = require('fs');
const path = require('path');
const ClassHelper = require('../helper/ClassHelper');
const HttpException = require('../error/HttpException');
const NotFound = require('../error/NotFoundHttpException');
const ServerError = require('../error/ServerErrorHttpException');