'use strict';

const Base = require('./Rbac');

module.exports = class RouteRbac extends Base {

    configure (cb) {
        async.series([
            cb => setImmediate(cb),
            cb => this.load(cb),
            cb => {
                this.useHandler();
                cb();
            }
        ], cb);
    }

    load (cb) {
        async.series([
            cb => super.load(cb),
            cb => {
                this.indexRoutes();
                cb();
            }
        ], cb);
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
            if (!item || !user) {
                return next();
            }
            if (user.isGuest()) {
                user.loginRequired();
            } else {
                user.can(item.name, (err, access)=> {
                    err ? next(new ServerErrorException(err))
                        : access ? next() : next(new ForbiddenException);
                }, req.query);
            }
        });
    }

    getRouteItemByPath (path) {
        path = path.split('?')[0].toLowerCase();
        while (!Object.prototype.hasOwnProperty.call(this.routeIndex, path)) {
            if (path.length < 2) {
                return null;
            }
            let pos = path.lastIndexOf('/');
            path = path.substring(0, pos > 0 ? pos : 1);
        }
        return this.routeIndex[path];
    }
};

const async = require('async');
const ServerErrorException = require('../errors/ServerErrorHttpException');
const ForbiddenException = require('../errors/ForbiddenHttpException');