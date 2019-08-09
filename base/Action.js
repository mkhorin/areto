/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Base');

module.exports = class Action extends Base {

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

    getQueryParam () {
        return this.controller.getQueryParam(...arguments);
    }

    getQueryParams () {
        return this.controller.getQueryParams();
    }

    getPostParam () {
        return this.controller.getPostParam(...arguments);
    }

    getPostParams () {
        return this.controller.getPostParams();
    }

    // RENDER

    render () {
        return this.controller.render(...arguments);
    }

    // SEND

    send () {
        return this.controller.send(...arguments);
    }

    sendText () {
        return this.controller.sendText(...arguments);
    }
};