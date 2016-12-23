'use strict';

const Base = require('./ExtEvent');

module.exports = class ActionEvent extends Base {

    constructor (action) {
        super({ action });
    }
};