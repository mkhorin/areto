/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
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
        return this.controller.module.getRoute(this.getRelativeModuleName());
    }

    render () {
        return this.controller.render.apply(this.controller, arguments);
    }
};