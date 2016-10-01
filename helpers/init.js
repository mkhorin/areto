'use strict';

// STRING

Object.assign(String.prototype, {

    toUpperCaseFirstLetter: function () {
        return this.charAt(0).toUpperCase() + this.slice(1);
    },

    toLowerCaseFirstLetter: function () {
        return this.charAt(0).toLowerCase() + this.slice(1);
    }
});

// REGEXP

// default - JSON.stringify(new RegExp) = {}
RegExp.prototype.toJSON = RegExp.prototype.toString;