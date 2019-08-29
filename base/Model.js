/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Component');

module.exports = class Model extends Base {

    static getExtendedClassProperties () {
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
            RULES: [
                // [['attr1', 'attr2'], '{type}', {...params}]
                // [['attr1', 'attr2'], '{model method name}']
                // [['attr1', 'attr2'], {validator class} ]
                // [['attr1', 'attr2'], '{type}', {on: ['scenario1']} ]
                // [['attr1', 'attr2'], '{type}', {except: ['scenario2']} ]
                // [['attr1'], 'unsafe'] // skip attribute loading  
            ],            
            SCENARIOS: {
                // default: ['attr1', 'attr2']
                // scenario1: ['attr2']
            },
            DEFAULT_SCENARIO: 'default',            
            ATTR_LABELS: {},
            ATTR_VALUE_LABELS: {},
            ATTR_HINTS: {},            
            EVENT_BEFORE_VALIDATE: 'beforeValidate',
            EVENT_AFTER_VALIDATE: 'afterValidate',
            NAME: this.getName(),
            CONTROLLER_DIR: 'controller',
            MODEL_DIR: 'model'
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

    _attrMap = {};
    _viewAttrMap = {};
    _errorMap = {};
    _validators = null;

    has (name) {
        return Object.prototype.hasOwnProperty.call(this._attrMap, name);
    }

    get (name) {
        if (Object.prototype.hasOwnProperty.call(this._attrMap, name)) {
            return this._attrMap[name];
        }
    }

    set (name, value) {
        this._attrMap[name] = value;
    }

    unset (name) {
        delete this._attrMap[name];
    }

    isAttrActive (name) {
        return this.getActiveAttrNames().includes(name);
    }

    isAttrRequired (name) {
        for (const validator of this.getActiveValidators(name)) {
            if (validator instanceof Validator.BUILTIN.required && validator.when === null) {
                return true;
            }
        }
        return false;
    }

    isAttrSafe (name) {
        return this.getSafeAttrNames().includes(name);
    }

    getAttrMap () {
        return this._attrMap;
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
        const map = this.getUnsafeAttrMap();
        return this.getActiveAttrNames().filter(name => !Object.prototype.hasOwnProperty.call(map, name));
    }

    getUnsafeAttrMap () {
        const map = {};
        for (const validator of this.getActiveValidatorsByClass(Validator.BUILTIN.unsafe)) {
            for (const attr of validator.attrs) {
                map[attr] = true;
            }
        }
        return map;
    }

    getActiveAttrNames () {
        return this.getScenarioAttrNames(this.scenario);
    }

    getScenarioAttrNames (scenario) {
        const names = {};
        const only = Array.isArray(this.SCENARIOS[scenario])
            ? this.SCENARIOS[scenario]
            : this.SCENARIOS[this.DEFAULT_SCENARIO];
        for (const validator of this.getValidators()) {
            if (validator.isActive(scenario)) {
                for (const name of validator.attrs) {
                    if (!Array.isArray(only) || only.includes(name)) {
                        names[name] = true;
                    }
                }
            }
        }
        return Object.keys(names);
    }

    setFromModel (name, model) {
        this._attrMap[name] = model.get(name);
    }

    setSafeAttrs (data) {
        if (data) {
            for (const name of this.getSafeAttrNames()) {
                if (data && Object.prototype.hasOwnProperty.call(data, name)) {
                    this.set(name, data[name]);
                }
            }
        }
    }

    setAttrs (data, except) {
        data = data instanceof Model ? data.getAttrMap() : data;
        if (data) {
            for (const key of Object.keys(data)) {
                if (Array.isArray(except) ? !except.includes(key) : (except !== key)) {
                    this._attrMap[key] = data[key];
                }
            }
        }
    }

    assignAttrs (data) {
        Object.assign(this._attrMap, data instanceof Model ? data.getAttrMap() : data);
    }

    // VIEW ATTRIBUTES

    getViewAttr (name) {
        return Object.prototype.hasOwnProperty.call(this._viewAttrMap, name)
            ? this._viewAttrMap[name]
            : this.get(name);
    }

    setViewAttr (name, value) {
        this._viewAttrMap[name] = value;
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

    // LOAD

    load (data) {        
        if (data) {
            this.setSafeAttrs(data[this.NAME]);
        }
        return this;
    }
    
    // EVENTS

    beforeValidate () {
        // call await super.beforeValidate() if override it
        return this.trigger(this.EVENT_BEFORE_VALIDATE);
    }

    afterValidate () {
        // call await super.afterValidate() if override it
        return this.trigger(this.EVENT_AFTER_VALIDATE);
    }

    // VALIDATION

    getValidationRules () {
        return this.RULES;
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

    getValidatorsByClass (Class, attr) {
        return this.getValidators().filter(validator => {
            return validator instanceof Class && (!attr || validator.attrs.includes(attr));
        });
    }

    getValidators () {
        if (!this._validators) {
            this._validators = this.createValidators();
        }
        return this._validators;
    }

    addValidator (rule) {
        rule = this.createValidator(rule);
        if (rule) {
            this.getValidators().push(rule);
        }
    }

    async setDefaultValues () {
        for (const validator of this.getActiveValidatorsByClass(Validator.BUILTIN.default)) {
            await validator.validateAttrs(this);
        }
    }

    async validate (attrNames) {       
        await this.beforeValidate();
        attrNames = attrNames || this.getActiveAttrNames();
        for (const validator of this.getActiveValidators()) {
            await validator.validateAttrs(this, attrNames);
        }
        await this.afterValidate();
        return !this.hasError();
    }

    createValidators () {
        const validators = [];
        for (const rule of this.getValidationRules()) {
            const validator = this.createValidator(rule);
            if (validator) {
                validators.push(validator);
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

    // ERRORS

    getErrors (attr) {
        return !attr ? this._errorMap : this.hasError(attr) ? this._errorMap[attr] : [];
    }
    
    hasError (attr) {
        return attr ? Object.prototype.hasOwnProperty.call(this._errorMap, attr)
                    : Object.values(this._errorMap).length > 0;
    }

    getFirstError (attr) {
        if (attr) {
            return this.hasError(attr) ? this._errorMap[attr][0] : '';
        }
        for (const data of Object.values(this._errorMap)) {
            if (data.length) {
                return data[0];
            }
        }
        return '';
    }

    getFirstErrorMap () {
        const result = {};
        for (const attr of Object.keys(this._errorMap)) {
            if (this._errorMap[attr].length) {
                result[attr] = this._errorMap[attr][0];
            }
        }
        return result;
    }

    addError (attr, error) {
        if (!error) {
            return false;
        }
        if (!this.hasError(attr)) {
            this._errorMap[attr] = [];
        }
        this._errorMap[attr].push(error);
    }

    addErrors (data) {
        if (data) {
            for (const attr of Object.keys(data)) {
                if (Array.isArray(data[attr])) {
                    for (const value of data[attr]) {
                        this.addError(attr, value);
                    }
                } else {
                    this.addError(attr, data[attr]);
                }
            }
        }
    }

    clearErrors (attr) {
        if (attr) {
            delete this._errorMap[attr]
        } else {
            this._errorMap = {};
        }
    }

    // MODEL CONTROLLER

    static getControllerClass () {
        if (!this.hasOwnProperty('_CONTROLLER_CLASS')) {
            const closest = FileHelper.getClosestDirectory(this.MODEL_DIR, this.CLASS_DIR);
            const dir = path.join(this.CONTROLLER_DIR, this.getNestedDir(), this.getControllerClassName());
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
const Validator = require('../validator/Validator');