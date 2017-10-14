'use strict';

// default - JSON.stringify(new RegExp) = {}
RegExp.prototype.toJSON = RegExp.prototype.toString;