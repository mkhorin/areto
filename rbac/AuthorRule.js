'use strict';

const Base = require('./Rule');

module.exports = class AuthorRule extends Base {

    execute (user, cb, params) {
        cb(null, params && MiscHelper.isEqual(user.getId(), params.authorId));
    }
};

const MiscHelper = require('../helpers/MiscHelper');