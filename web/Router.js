/**
 * @copyright Copyright (c) 2018 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('../base/Component');

module.exports = class Router extends Base {

    constructor (config) {
        super(config);
        this.attachDefault();
        this.attachDir(this.module.getControllerDir());
        if (this.errors) {
            this.attachErrorHandlers(this.errors);
        }
    }

    attachDefault (Controller) {
        if (Controller === undefined) {
            try {
                Controller = this.module.getDefaultController();
            } catch (err) {}
        }
        if (Controller && Controller.DEFAULT_ACTION) {
            let controller = new Controller;
            let id = Controller.DEFAULT_ACTION;
            if (controller.getActionIds().includes(id)) {
                this.attachAction(id, controller, '');
            }
        }
    }

    attachDir (dir) {
        let files = [];
        try {
            files = fs.readdirSync(dir);
        } catch (err) {
        }
        for (let file of files) {
            this.attachFile(path.join(dir, file));
        }
    }

    attachFile (file) {
        let stat = fs.lstatSync(file);
        if (stat.isDirectory()) {
            return this.attachDir(file);
        }
        this.attach(require(file));
    }

    attach (Controller) {
        let controller = new Controller;
        let route = `/${Controller.NAME}`;
        for (let id of controller.getActionIds()) {
            this.attachAction(id, controller, `${route}/${id}`);
            if (controller.DEFAULT_ACTION === id) {
                this.attachAction(id, controller, route);
            }
        }
    }

    attachAction (id, controller, route) {       
        let action = function (req, res, next) {
            (new controller.constructor).assign(req, res).execute(id).catch(next);
        };
        let methods = controller.METHODS[id] || ['all'];
        if (!(methods instanceof Array)) {
            methods = [methods];
        }
        for (let method of methods) {
            this.module.appendToExpress(method.toLowerCase(), route, action);
        }
    }

    attachErrorHandlers (config) {
        this.module.appendToExpress('all', '*', function (req, res, next) {
            next(new NotFoundHttpException());
        });
        let Controller = config.Controller || this.module.getDefaultController();
        this.module.appendToExpress('use', function (err, req, res, next) {
            if (!(err instanceof HttpException)) {
                err =  new ServerErrorHttpException(err);
            }
            err.setParams(req, res);
            if (!Controller) {
                return next(err);
            }
            let action = config.action || 'error';
            (new Controller).assign(req, res, err).execute(action).catch(next);
        });
    }
};

const fs = require('fs');
const path = require('path');
const HttpException = require('../error/HttpException');
const ServerErrorHttpException = require('../error/ServerErrorHttpException');
const NotFoundHttpException = require('../error/NotFoundHttpException');