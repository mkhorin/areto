'use strict';

const Base = require('./Rule');

module.exports = class AuthorRule extends Base {

    execute (cb) {
        if (this.params.user.isGuest()) {
            return cb(null, false);
        }
        let passed = MongoHelper.isEqual(this.params.user.getId(), this.params.authorId);
        cb(null, passed);
    }
};

const MongoHelper = require('../helper/MongoHelper');