/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Identity extends Base {

    getAssignments () {
        // get user's assigned roles []
        return Promise.resolve(this.module.components.rbac.getUserAssignments(this.getId()));
    }

    getAuthKey () {
        return this.get('authKey'); // get auth key to remember me
    }

    validateAuthKey (key) {
        return this.getAuthKey() === key;
    }

    setAuthKey () {
        this.set('authKey', SecurityHelper.generateRandomString(16));
    }
};

const SecurityHelper = require('../helper/SecurityHelper');