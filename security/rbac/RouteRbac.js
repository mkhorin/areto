/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Rbac');

module.exports = class RouteRbac extends Base {

    async init () {
        await PromiseHelper.setImmediate();
        await this.load();
        this.module.addHandler('use', this.handleRoute.bind(this));
    }

    async load () {
        await super.load();
        this.indexRoutes();
    }

    indexRoutes () {
        this.routeMap = {};
        for (const name of Object.keys(this.itemMap)) {
            if (this.itemMap[name].isRoute()) {
                this.routeMap[name] = this.itemMap[name];
            }
        }
    }

    handleRoute (req, res, next) {
        const user = res.locals.user;
        const item = this.getRouteItemByPath(req.path);
        if (!item || !user) {
            return next();
        }
        if (user.isGuest()) {
            if (req.xhr || !user.getLoginUrl()) {
                return next(new Forbidden);
            }
            user.setReturnUrl(req.originalUrl);
            const url = user.module.get('url').resolve(user.getLoginUrl(), user.module.NAME);
            return res.redirect(url);
        }        
        user.can(item.name, req.query).then(access => {
            access ? next() : next(new Forbidden);
        }).catch(err => {
            next(new ServerError(err));
        });
    }

    getRouteItemByPath (path) {
        const index = path.indexOf('?');
        if (index !== -1) {
            path = path.substring(0, index);    
        }
        path = path.toLowerCase();
        while (!Object.prototype.hasOwnProperty.call(this.routeMap, path)) {
            if (path.length < 2) {
                return null;
            }
            const pos = path.lastIndexOf('/');
            path = path.substring(0, pos > 0 ? pos : 1);
        }
        return this.routeMap[path];
    }
};

const PromiseHelper = require('../../helper/PromiseHelper');
const ServerError = require('../../error/ServerErrorHttpException');
const Forbidden = require('../../error/ForbiddenHttpException');