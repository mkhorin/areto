'use strict';

const Base = require('./Rbac');

module.exports = class RouteRbac extends Base {

    configure (cb) {
        AsyncHelper.series([
            cb => setImmediate(cb),
            cb => this.load(cb),
            cb => {
                this.useHandler();
                cb();
            }
        ], cb);
    }

    load (cb) {
        AsyncHelper.series([
            cb => super.load(cb),
            cb => {
                this.indexRoutes();
                cb();
            }
        ], cb);
    }

    indexRoutes () {
        this.routeMap = {};
        for (let name of Object.keys(this.itemMap)) {
            if (this.itemMap[name].isRoute()) {
                this.routeMap[name] = this.itemMap[name];
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
            if (user.isAnonymous()) {
                return user.loginRequired();
            }
            user.can(item.name, (err, access)=> {
                err ? next(new ServerErrorException(err))
                    : access ? next() : next(new ForbiddenException);
            }, req.query);
        });
    }

    getRouteItemByPath (path) {
        path = path.split('?')[0].toLowerCase();
        while (!Object.prototype.hasOwnProperty.call(this.routeMap, path)) {
            if (path.length < 2) {
                return null;
            }
            let pos = path.lastIndexOf('/');
            path = path.substring(0, pos > 0 ? pos : 1);
        }
        return this.routeMap[path];
    }
};

const AsyncHelper = require('../helpers/AsyncHelper');
const ServerErrorException = require('../errors/ServerErrorHttpException');
const ForbiddenException = require('../errors/ForbiddenHttpException');