/**
 * @copyright Copyright (c) 2018 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('./Rbac');

module.exports = class RouteRbac extends Base {

    async init () {
        await PromiseHelper.setImmediate();
        await this.load();
        this.module.appendToExpress('use', this.handleRoute.bind(this));
    }

    async load () {
        await super.load();
        this.indexRoutes();
    }

    indexRoutes () {
        this.routeMap = {};
        for (let name of Object.keys(this.itemMap)) {
            if (this.itemMap[name].isRoute()) {
                this.routeMap[name] = this.itemMap[name];
            }
        }
    }

    handleRoute (req, res, next) {
        let user = res.locals.user;
        let item = this.getRouteItemByPath(req.path);
        if (!item || !user) {
            return next();
        }
        if (user.isGuest()) {
            return user.loginRequired();
        }        
        user.can(item.name, req.query).then(access => {
            access ? next() : next(new ForbiddenException)
        }).catch(err => {
            next(new ServerErrorException(err));
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

const PromiseHelper = require('../helper/PromiseHelper');
const ServerErrorException = require('../error/ServerErrorHttpException');
const ForbiddenException = require('../error/ForbiddenHttpException');