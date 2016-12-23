'use strict';

const Base = require('./Rule');
const helper = require('../helpers/MainHelper');

module.exports = class AuthorRule extends Base {

    execute (user, cb, params) {
        cb(null, params && helper.isEqualIds(user.getId(), params.authorId));
    }
};