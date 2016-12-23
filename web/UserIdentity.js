'use strict';

const Base = require('../db/ActiveRecord');
const security = require('../helpers/SecurityHelper');

module.exports = class UserIdentity extends Base {

    static findIdentity (id) {
        return this.findById(id);
    }

    getAssignments (cb) {
        // get user's assigned roles - []
        cb(null, this.module.components.rbac.getUserAssignments(this.getId()));
    }

    getAuthKey () {
        return this.get('authKey'); // get auth key to remember me
    }

    validateAuthKey (key) {
        return this.getAuthKey() === key;
    }

    setAuthKey (cb) {
        security.generateRandomString(16, (err, result)=> {
            this.set('authKey', result);
            cb(err);
        });
    }
};