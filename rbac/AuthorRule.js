/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Rule');

module.exports = class AuthorRule extends Base {

    async execute () {
        return !this.params.user.isGuest()
            && MongoHelper.isEqual(this.params.user.getId(), this.params.authorId);
    }
};

const MongoHelper = require('../helper/MongoHelper');