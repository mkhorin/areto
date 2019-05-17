/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Identity extends Base {

    getAssignments () {
        // get user's assigned roles []
        return Promise.resolve(this.module.get('rbac').getUserAssignments(this.getId()));
    }

    getAuthKey () {
        return this.get('authKey'); // get auth key to remember me
    }

    validateAuthKey (key) {
        return this.getAuthKey() === key;
    }

    setAuthKey () {
        this.set('authKey', SecurityHelper.getRandomString(16));
    }
};

const SecurityHelper = require('../helper/SecurityHelper');