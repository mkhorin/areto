'use strict';

const Base = require('./Rule');

module.exports = class AuthorRule extends Base {

    execute (cb) {
        if (!this.params.user) {
            return cb(null, false);
        }
        cb(null, CommonHelper.isEqual(this.params.user.getId(), this.params.authorId));
    }
};

const CommonHelper = require('../helpers/CommonHelper');