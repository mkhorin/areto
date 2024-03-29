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
        return action.user.auth.csrf
            && action.isPostRequest()
            && super.isActive(action);
    }

    beforeAction ({controller}) {
        if (controller.getPostParam(this.csrfParam) !== controller.getCsrfToken()) {
            throw new BadRequest('Invalid CSRF token');
        }
    }
};

const BadRequest = require('../error/http/BadRequest');