'use strict';

const Base = require('../db/ActiveRecord');

module.exports = class UserIdentity extends Base {

    static findIdentity (id) {
        return this.findById(id);
    }

    static findSame (data) {
        return this.find({name: data.name});
    }

    static create (data, cb) {
        let model = new this({scenario: 'create'});
        AsyncHelper.waterfall([
            cb => this.findSame(data).one(cb),
            (found, cb)=> {
                if (!found) {
                    model.setSafeAttrs(data);
                    return model.save(cb);
                }
                this.module.log('warn', `User already exists: ${JSON.stringify(data)}`);
                cb();
            },
            cb => {
                if (model.hasError()) {
                    let error = this.module.components.i18n.translateMessageMap(model.getFirstErrors());
                    this.module.log('error', `${this.name}: ${JSON.stringify(error)}: ${JSON.stringify(data)}`);
                }
                cb();
            }
        ], cb);
    }

    getAssignments (cb) {
        // get user's assigned roles []
        cb(null, this.module.components.rbac.getUserAssignments(this.getId()));
    }

    getAuthKey () {
        return this.get('authKey'); // get auth key to remember me
    }

    validateAuthKey (key) {
        return this.getAuthKey() === key;
    }

    setAuthKey (cb) {
        AsyncHelper.waterfall([
            cb => SecurityHelper.generateRandomString(16, cb),
            (result, cb)=> {
                this.set('authKey', result);
                cb();
            }
        ], cb);
    }
};

const AsyncHelper = require('../helpers/AsyncHelper');
const SecurityHelper = require('../helpers/SecurityHelper');