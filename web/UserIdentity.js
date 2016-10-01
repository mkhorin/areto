'use strict';

let Base = require('../db/ActiveRecord');
let security = require('../helpers/security');

module.exports = class UserIdentity extends Base {

    static findIdentity (id) {
        return this.findById(id);
    }

    getAssignments (cb) {
        cb(null, [this.get('role')]); // get user assigned roles []
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