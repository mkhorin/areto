/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Rule');

module.exports = class AuthorRule extends Base {

    async execute () {
        const user = this.getUser();
        return !user.isGuest() && this.isEqual(user.getId(), this.params.authorId);
    }
};