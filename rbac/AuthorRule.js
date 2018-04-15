'use strict';

const Base = require('./Rule');

module.exports = class AuthorRule extends Base {

    execute (cb) {
        if (this.params.user.isAnonymous()) {
            return cb(null, false);
        }
        let passed = CommonHelper.isEqual(this.params.user.getId(), this.params.authorId);
        cb(null, passed);
    }
};

const CommonHelper = require('../helpers/CommonHelper');