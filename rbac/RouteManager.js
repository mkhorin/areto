'use strict';

let Base = require('./Manager');
let async = require('async');

module.exports = class RouteManager extends Base {

    configure (cb) {
        setImmediate(()=>{
            this.load(err =>{
                if (!err) {
                    this.useHandler();
                }
                cb(err);
            });
        });
    }

    load (cb) {
        super.load(err => {
            if (!err) {
                this.indexRoutes();
            }
            cb(err);
        });
    }

    indexRoutes () {
        this.routeIndex = {};
        for (let name of Object.keys(this.itemIndex)) {
            if (this.itemIndex[name].isRoute()) {
                this.routeIndex[name] = this.itemIndex[name];
            }
        }
    }

    useHandler (module) {
        module.appendToExpress('use', (req, res, next)=> {
            let user = res.locals.user;
            let item = this.getRouteItemByPath(req.path);
            if (item && user) {
                if (user.isGuest()) {
                    user.loginRequired();
                } else {
                    user.can(item.name, (err, access)=> {
                        err ? next(new ServerErrorException(err)) : access ? next() : next(new ForbiddenException);
                    }, req.query);
                }
            } else next();
        });
    }

    getRouteItemByPath (path) {
        path = path.split('?')[0].toLowerCase();
        while (!(path in this.routeIndex)) {
            if (path.length < 2) {
                return null;
            }
            let pos = path.lastIndexOf('/');
            path = path.substring(0, pos > 0 ? pos : 1);
        }
        return this.routeIndex[path];
    }
};

let ServerErrorException = require('../errors/ServerErrorHttpException');
let ForbiddenException = require('../errors/ForbiddenHttpException');