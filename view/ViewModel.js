/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class ViewModel extends Base {

    static getExtendedClassProperties () {
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

    static getAttrLabel (name) {
        if (!this.hasOwnProperty('_GENERATED_LABELS')) {
            this._GENERATED_LABELS = {...this.ATTR_LABELS};
        }
        if (!Object.prototype.hasOwnProperty.call(this._GENERATED_LABELS, name)) {
            this._GENERATED_LABELS[name] = this.generateAttrLabel(name);
        }
        return this._GENERATED_LABELS[name];
    }

    static generateAttrLabel (name) {
        return StringHelper.generateLabel(name);
    }

    static getAttrValueLabels (name) {
        return this.ATTR_VALUE_LABELS[name];
    }

    static getAttrValueLabel (name, value) {
        return this.ATTR_VALUE_LABELS[name]?.[value];
    }

    constructor (config) {
        super(config);
        this.module = this.view.module;
        this.controller = this.view.controller;
        this.data = this.data || {};
        this.data._viewModel = this;
    }

    async getTemplateData () {
        return Object.assign(this.data, await this.resolveTemplateData());
    }

    resolveTemplateData () {
        // to override
    }

    prepareModels () {
        // to override
    }

    getAttrLabel (name) {
        return this.constructor.getAttrName(name);
    }

    getAttrHint (name) {
        return ObjectHelper.getValue(name, this.ATTR_HINTS);
    }

    format () {
        return this.controller.format(...arguments);
    }

    translate () {
        return this.controller.translate(...arguments);
    }

    translateMessageMap () {
        return this.controller.translateMessageMap(...arguments);
    }
};
module.exports.init();

const ObjectHelper = require('../helper/ObjectHelper');
const StringHelper = require('../helper/StringHelper');