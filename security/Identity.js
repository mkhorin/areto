/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Identity extends Base {

    getId () {
        return this.get(this.PK);
    }

    getTitle () {
        return this.getId();
    }

    getAssignments () {
        // get user's assigned roles []
        return this.module.get('rbac').getUserAssignments(this.getId());
    }

    getAuthKey () {
        return this.get('authKey'); // key for 'remember me' cookie
    }

    setAuthKey () {
        this.set('authKey', SecurityHelper.getRandomString(16));
    }

    checkAuthKey (key) {
        return this.getAuthKey() === key;
    }
};

const SecurityHelper = require('../helper/SecurityHelper');