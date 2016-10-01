'use strict';

let Base = require('./ExtEvent');

module.exports = class ActionEvent extends Base {

    constructor (action) {
        super({ action });
    }
};