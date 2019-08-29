/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Rule');

module.exports = class AuthorRule extends Base {

    async execute () {
        return !this.params.user.isGuest()
            && CommonHelper.isEqual(this.params.user.getId(), this.params.authorId);
    }
};

const CommonHelper = require('../../helper/CommonHelper');