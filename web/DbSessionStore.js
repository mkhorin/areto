'use strict';

const Base = require('./SessionStore');

module.exports = class DbSessionStore extends Base {

    destroy (sid, cb) {
        this.findBySid(sid).remove(cb);
    }

    clear (cb) {
        this.find().remove(cb);
    }

    find () {
        return (new Query).db(this.db).from(this.table);
    }

    findBySid (sid) {
        return this.find().where({sid});
    }
};

const Query = require('../db/Query');