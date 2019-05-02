/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Component');

module.exports = class Model extends Base {

    static getExtendedClassProps () {
        return [
            'BEHAVIORS',
            'SCENARIOS',
            'ATTR_HINTS',
            'ATTR_LABELS',
            'ATTR_VALUE_LABELS'
        ];
    }

    static getConstants () {
        return {
            NAME: this.getName(),
            RULES: [
                // [['attr1', 'attr2'], '{type}', {...params}]
                // [['attr1', 'attr2'], '{model method name}']
                // [['attr1', 'attr2'], {validator class} ]
                // [['attr1', 'attr2'], '{type}', {on: ['scenario1']} ]
                // [['attr1', 'attr2'], '{type}', {except: ['scenario2']} ]
                // [['attr1'], 'unsafe'] - skip to load
            ],
            CONTROLLER_DIR: 'controller',
            MODEL_DIR: 'model',
            DEFAULT_SCENARIO: 'default',
            SCENARIOS: {
                // default: ['attr1', 'attr2']
                // scenario1: ['attr2']
            },
            EVENT_BEFORE_VALIDATE: 'beforeValidate',
            EVENT_AFTER_VALIDATE: 'afterValidate',
            ATTR_HINTS: {},
            ATTR_LABELS: {},
            ATTR_VALUE_LABELS: {}
        }   
    }

    static getName () {
        return this.name;
    }

    static getAttrValueLabels (name) {
        return this.ATTR_VALUE_LABELS[name];
    }

    static getAttrValueLabel (name, value) {
        return this.ATTR_VALUE_LABELS[name] && this.ATTR_VALUE_LABELS[name][value];
    }

    constructor (config) {
        super(config);
        this._attrs = {};
        this._viewAttrs = {};
        this._errors = {};
        this._validators = null;
    }

    // ATTRIBUTES

    isAttrActive (name) {
        return this.getActiveAttrNames().includes(name);
    }

    isAttrSafe (name) {
        return this.getSafeAttrNames().includes(name);
    }

    isAttrRequired (name) {
        for (let validator of this.getActiveValidators(name)) {
            if (validator instanceof Validator.BUILTIN.required && validator.when === null) {
                return true;
            }
        }
        return false;
    }

    has (name) {
        return Object.prototype.hasOwnProperty.call(this._attrs, name);
    }

    get (name) {
        if (Object.prototype.hasOwnProperty.call(this._attrs, name)) {
            return this._attrs[name];
        }
    }

    getAttrLabel (name) {
        return Object.prototype.hasOwnProperty.call(this.ATTR_LABELS, name)
            ? this.ATTR_LABELS[name]
            : this.generateAttrLabel(name);
    }

    getAttrHint (name) {
        return ObjectHelper.getValue(name, this.ATTR_HINTS, '');
    }

    getFormAttrId (name, prefix) {
        return prefix ? `${prefix}-${this.NAME}-${name}` : `${this.NAME}-${name}`;
    }

    getFormAttrName (name) {
        return `${this.NAME}[${name}]`;
    }

    getSafeAttrNames () {
        let map = this.getUnsafeAttrMap();
        return this.getActiveAttrNames().filter(name => !Object.prototype.hasOwnProperty.call(map, name));
    }

    getUnsafeAttrMap () {
        let map = {};
        for (let validator of this.getActiveValidatorsByClass(Validator.BUILTIN.unsafe)) {
            for (let attr of validator.attrs) {
                map[attr] = true;
            }
        }
        return map;
    }

    getActiveAttrNames () {
        return this.getScenarioAttrNames(this.scenario);
    }

    getScenarioAttrNames (scenario) {
        let names = {};
        let only = Array.isArray(this.SCENARIOS[scenario])
            ? this.SCENARIOS[scenario]
            : this.SCENARIOS[this.DEFAULT_SCENARIO];
        for (let validator of this.getValidators()) {
            if (validator.isActive(scenario)) {
                for (let name of validator.attrs) {
                    if (!Array.isArray(only) || only.includes(name)) {
                        names[name] = true;
                    }
                }
            }
        }
        return Object.keys(names);
    }

    getAttrs () {
        return {...this._attrs};
    }

    getAttrsByNames (names) {
        let values = {};
        for (let name of names) {
            values[name] = this._attrs[name];
        }
        return values;
    }

    set (name, value) {
        this._attrs[name] = value;
    }

    setFromModel (name, model) {
        this._attrs[name] = model.get(name);
    }

    setSafeAttrs (data) {
        if (data) {
            for (let name of this.getSafeAttrNames()) {
                if (data && Object.prototype.hasOwnProperty.call(data, name)) {
                    this.set(name, data[name]);
                }
            }
        }
    }

    setAttrs (data, except) {
        data = data instanceof Model ? data._attrs : data;
        if (data) {
            for (let key of Object.keys(data)) {
                if (Array.isArray(except) ? !except.includes(key) : (except !== key)) {
                    this._attrs[key] = data[key];
                }
            }
        }
    }

    assignAttrs (data) {
        Object.assign(this._attrs, data instanceof Model ? data._attrs : data);
    }

    unset (name) {
        delete this._attrs[name];
    }

    // VIEW ATTRIBUTES

    getViewAttr (name) {
        return Object.prototype.hasOwnProperty.call(this._viewAttrs, name)
            ? this._viewAttrs[name]
            : this.get(name);
    }

    setViewAttr (name, value) {
        this._viewAttrs[name] = value;
    }

    // LABELS

    generateAttrLabel (name) {
        this.ATTR_LABELS[name] = StringHelper.toFirstUpperCase(StringHelper.camelToWords(name).toLowerCase());
        return this.ATTR_LABELS[name];
    }

    getAttrValueLabel (name, data) {
        return ObjectHelper.getValueOrKey(this.get(name), data || this.ATTR_VALUE_LABELS[name]);
    }

    setAttrValueLabel (name, data) {
        this.setViewAttr(name, this.getAttrValueLabel(name, data));
    }

    // ERRORS

    hasError (attr) {
        return attr ? Object.prototype.hasOwnProperty.call(this._errors, attr)
                    : Object.values(this._errors).length > 0;
    }

    getErrors (attr) {
        return !attr ? this._errors : this.hasError(attr) ? this._errors[attr] : [];
    }

    getFirstError (attr) {
        if (attr) {
            return this.hasError(attr) ? this._errors[attr][0] : '';
        }
        for (let error of Object.values(this._errors)) {
            if (error.length) {
                return error[0];
            }
        }
        return '';
    }

    getFirstErrors () {
        let result = {};
        for (let attr of Object.keys(this._errors)) {
            if (this._errors[attr].length) {
                result[attr] = this._errors[attr][0];
            }
        }
        return result;
    }

    addError (attr, error) {
        if (!error) {
            return false;
        }
        if (!this.hasError(attr)) {
            this._errors[attr] = [];
        }
        this._errors[attr].push(error);
    }

    addErrors (data) {
        if (data) {
            for (let attr of Object.keys(data)) {
                if (Array.isArray(data[attr])) {
                    for (let value of data[attr]) {
                        this.addError(attr, value);
                    }
                } else {
                    this.addError(attr, data[attr]);
                }
            }
        }
    }

    clearErrors (attr) {
        attr ? delete this._errors[attr]
             : this._errors = {};
    }
    // LOAD

    static loadMultiple (models, data) {
        // TODO...
    }

    load (data) {        
        if (data) {
            this.setSafeAttrs(data[this.NAME]);
        }
        return this;
    }

    // EVENTS

    beforeValidate () {
        // call await super.beforeValidate() if override this method
        return this.trigger(this.EVENT_BEFORE_VALIDATE);
    }

    afterValidate () {
        // call await super.afterValidate() if override this method
        return this.trigger(this.EVENT_AFTER_VALIDATE);
    }

    // VALIDATE

    async validate (attrNames) {
        attrNames = attrNames || this.getActiveAttrNames();
        await this.beforeValidate();
        for (let validator of this.getActiveValidators()) {
            await validator.validateAttrs(this, attrNames);
        }
        await this.afterValidate();
        return !this.hasError();
    }

    addValidator (rule) {
        rule = this.createValidator(rule);
        if (rule) {
            this.getValidators().push(rule);
        }
    }

    getValidators () {
        if (!this._validators) {
            this._validators = this.createValidators();
        }
        return this._validators;
    }

    getValidatorsByClass (Class, attr) {
        return this.getValidators().filter(validator => {
            return validator instanceof Class && (!attr || validator.attrs.includes(attr));
        });
    }

    getActiveValidatorsByClass (Class, attr) {
        return this.getValidators().filter(validator => {
            return validator instanceof Class
                && validator.isActive(this.scenario)
                && (!attr || validator.attrs.includes(attr));
        });
    }

    getActiveValidators (attr) {
        return this.getValidators().filter(validator => {
            return validator.isActive(this.scenario) && (!attr || validator.attrs.includes(attr));
        });
    }

    async setDefaultValues () {
        for (let validator of this.getActiveValidatorsByClass(Validator.BUILTIN.default)) {
            await validator.validateAttrs(this);
        }
    }

    createValidators () {
        let validators = [];
        for (let rule of this.RULES) {
            rule = this.createValidator(rule);
            if (rule) {
                validators.push(rule);
            }
        }
        return validators;
    }

    createValidator (rule) {
        if (rule instanceof Validator) {
            return rule;
        }
        if (Array.isArray(rule) && rule[0] && rule[1]) {
            return Validator.createValidator(rule[1], this, rule[0], rule[2]);
        }
        this.log('error', 'Invalid validation rule', rule);
    }

    // MODEL CONTROLLER

    static getControllerClass () {
        if (!this.hasOwnProperty('_CONTROLLER_CLASS')) {
            let closest = FileHelper.getClosestDir(this.MODEL_DIR, this.CLASS_DIR);
            let dir = path.join(this.CONTROLLER_DIR, this.getNestedDir(), this.getControllerClassName());
            this._CONTROLLER_CLASS = require(path.join(path.dirname(closest), dir));
        }
        return this._CONTROLLER_CLASS;
    }

    static getControllerClassName () {
        return this.NAME + 'Controller';
    }

    static getNestedDir () {
        if (!this.hasOwnProperty('_NESTED_DIR')) {
            this._NESTED_DIR = FileHelper.getRelativePathByDir(this.MODEL_DIR, this.CLASS_DIR);
        }
        return this._NESTED_DIR;
    }

    getControllerClass () {
        return this.constructor.getControllerClass();
    }

    createController (config) {
        return this.spawn(this.getControllerClass(), config);
    }
};
module.exports.init();

const path = require('path');
const FileHelper = require('../helper/FileHelper');
const ObjectHelper = require('../helper/ObjectHelper');
const StringHelper = require('../helper/StringHelper');
const Event = require('../base/Event');
const Validator = require('../validator/Validator');