/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
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

    static getAttrValueLabels (name) {
        return this.ATTR_VALUE_LABELS[name];
    }

    static getAttrValueLabel (name, value) {
        return this.ATTR_VALUE_LABELS[name] && this.ATTR_VALUE_LABELS[name][value];
    }

    constructor (config) {
        super(config);
        this.controller = this.view.controller;
        this.data = this.data || {};
        this.data._viewModel = this;
        this._attrs = {};
    }

    async getTemplateData () {
        return Object.assign(this.data, await this.resolveTemplateData());
    }

    resolveTemplateData () {
        return {}; // to override
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

    format () {
        return this.controller.format.apply(this.controller, arguments);
    }

    translate () {
        return this.controller.translate.apply(this.controller, arguments);
    }

    translateMessageMap () {
        return this.controller.translateMessageMap.apply(this.controller, arguments);
    }
};
module.exports.init();

const ObjectHelper = require('../helper/ObjectHelper');
const StringHelper = require('../helper/StringHelper');