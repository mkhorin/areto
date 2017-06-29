'use strict';

const Base = require('../base/Component');

module.exports = class Router extends Base {

    init () {
        super.init();        
        this.attachDefault();
        this.attachAll();
        this.errors && this.attachErrorHandlers(this.errors);
    }
    
    attachErrorHandlers (config) {
        this.module.appendToExpress('all', '*', function (req, res, next) {
            next(new NotFoundHttpException());
        });
        let Controller = config.Controller || this.module.getDefaultController();
        this.module.appendToExpress('use', function (err, req, res, next) {            
            err = err instanceof HttpException ? err : new ServerErrorHttpException(err);
            err.setParams(req, res);
            Controller ? (new Controller).assign(req, res, next, err).execute(config.action || 'error') 
                       : next(err);
        });
    }

    attach (Controller) {
        try {
            let controller = new Controller;
            let route = `/${Controller.ID}`;
            for (let id of controller.getActionIds()) {
                this.attachAction(id, controller, `${route}/${id}`);
                if (controller.DEFAULT_ACTION === id) {
                    this.attachAction(id, controller, route);
                }
            }
        } catch (err) {
            this.module.log('error', `${this.constructor.name}: attach`, err);
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

    attachAll () {
        let dir = this.module.getControllerDir();
        try {
            fs.readdirSync(dir).forEach(filename => {
                let file = path.join(dir, filename);
                if (fs.lstatSync(file).isFile()) {
                    try {
                        this.attach(require(file));
                    } catch (err) {
                        this.module.log('error', `${this.constructor.name}: ${file}`, err);
                    }    
                }
            });
        } catch (err) {}
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
};

const fs = require('fs');
const path = require('path');
const MainHelper = require('../helpers/MainHelper');
const HttpException = require('../errors/HttpException');
const ServerErrorHttpException = require('../errors/ServerErrorHttpException');
const NotFoundHttpException = require('../errors/NotFoundHttpException');