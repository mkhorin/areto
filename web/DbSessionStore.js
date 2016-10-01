'use strict';

let Base = require('./SessionStore');

module.exports = class DbSessionStore extends Base {

    destroy (sid, cb) {
        this.findBySid(sid).remove(cb);
    }

    clear (cb) {
        this.find().remove(cb);
    }

    find () {
        return new Query(this.db).from(this.table);
    }

    findBySid (sid) {
        return this.find().where({sid});
    }
};

let Query = require('../db/Query');