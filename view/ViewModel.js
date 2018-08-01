'use strict';

const Base = require('../base/Base');

module.exports = class ViewModel extends Base {

    static getExtendedClassProps () {
        return [
            'ATTR_HINTS',
            'ATTR_LABELS',
            'ATTR_VALUE_LABELS'
        ];
    }

    static getConstants () {
        return {
            ATTR_HINTS: {},
            ATTR_LABELS: {},
            ATTR_VALUE_LABELS: {}
        }   
    }

    init () {
        this._attrs = {};
    }

    has (name) {
        return Object.prototype.hasOwnProperty.call(this._attrs, name);
    }

    get (name) {
        if (Object.prototype.hasOwnProperty.call(this._attrs, name)) {
            return this._attrs[name];
        }
    }

    set (name, value) {
        this._attrs[name] = value;
    }

    unset (name) {
        delete this._attrs[name];
    }

    getAttrLabel (name) {
        return Object.prototype.hasOwnProperty.call(this.ATTR_LABELS, name)
            ? this.ATTR_LABELS[name]
            : this.generateAttrLabel(name);
    }

    getAttrHint (name) {
        return ObjectHelper.getValue(name, this.ATTR_HINTS, '');
    }

    generateAttrLabel (name) {
        this.ATTR_LABELS[name] = StringHelper.camelToWords(StringHelper.camelize(name));
        return this.ATTR_LABELS[name];
    }

    getAttrValueLabel (name, data) {
        return ObjectHelper.getValueOrKey(this.get(name), data || this.ATTR_VALUE_LABELS[name]);
    }

    setAttrValueLabel (name, data) {
        this.set(name, this.getAttrValueLabel(name, data));
    }
};
module.exports.init();

const AsyncHelper = require('../helper/AsyncHelper');
const ObjectHelper = require('../helper/ObjectHelper');
const StringHelper = require('../helper/StringHelper');