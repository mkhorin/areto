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
            Controller = this.module.getDefaultController();
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
        try {
            fs.readdirSync(dir).forEach(file => {
                this.attachFile(path.join(dir, file));
            });
        } catch (err) {}
    }

    attachFile (file) {
        let stat = fs.lstatSync(file);
        if (stat.isDirectory()) {
            return this.attachDir(file);
        }
        try {
            this.attach(require(file));
        } catch (err) {
            this.log('error', file, err);
        }
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
            (new controller.constructor).assign(req, res, next).execute(id);
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
        this.module.appendToExpress('use', function handleError (err, req, res, next) {
            err = err instanceof HttpException ? err : new ServerErrorHttpException(err);
            err.setParams(req, res);
            Controller 
                ? (new Controller).assign(req, res, next, err).execute(config.action || 'error')
                : next(err);
        });
    }
};

const fs = require('fs');
const path = require('path');
const HttpException = require('../error/HttpException');
const ServerErrorHttpException = require('../error/ServerErrorHttpException');
const NotFoundHttpException = require('../error/NotFoundHttpException');