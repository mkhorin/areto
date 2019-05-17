/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Base');

module.exports = class Action extends Base {

    module = this.controller.module;

    execute () {
        throw new Error('Need to override');
    }

    getRelativeModuleName () {
        return `${this.controller.NAME}/${this.name}`;
    }

    getUniqueName () {
        return this.module.getRoute(this.getRelativeModuleName());
    }

    // REQUEST

    isGet () {
        return this.controller.isGet();
    }

    isPost () {
        return this.controller.isPost();
    }

    getQueryParam (...args) {
        return this.controller.getQueryParam(...args);
    }

    getQueryParams () {
        return this.controller.getQueryParams();
    }

    getPostParam (...args) {
        return this.controller.getPostParam(...args);
    }

    getPostParams () {
        return this.controller.getPostParams();
    }

    // RENDER

    render (...args) {
        return this.controller.render(...args);
    }

    // SEND

    send (...args) {
        return this.controller.send(...args);
    }

    sendText (...args) {
        return this.controller.sendText(...args);
    }
};