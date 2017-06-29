'use strict';

const Base = require('../db/ActiveRecord');

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
        SecurityHelper.generateRandomString(16, (err, result)=> {
            if (err) {
                return cb(err);
            }
            this.set('authKey', result);
            cb();
        });
    }
};

const SecurityHelper = require('../helpers/SecurityHelper');