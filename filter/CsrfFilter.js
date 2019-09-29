/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./ActionFilter');

module.exports = class CsrfFilter extends Base {

    constructor (config) {
        super({
            csrfParam: 'csrf',
            ...config
        });
    }

    isActive (action) {
        return action.controller.user.auth.csrf
            && action.isPost()
            && super.isActive(action);
    }

    beforeAction (action) {
        if (action.getPostParam(this.csrfParam) !== action.controller.getCsrfToken()) {
            throw new BadRequest('Invalid CSRF token');
        }
    }
};

const BadRequest = require('../error/BadRequestHttpException');