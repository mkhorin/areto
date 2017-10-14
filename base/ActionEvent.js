'use strict';

const Base = require('./Event');

module.exports = class ActionEvent extends Base {

    constructor (action) {
        super({action});
    }
};