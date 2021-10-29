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
            CONTROLLER_DIRECTORY: 'controller',
            MODEL_DIRECTORY: 'model'
        }   
    }

    _attrMap = {};
    _viewAttrMap = {};
    _errorMap = {};
    _validators = null;

    has (name) {
        return Object.prototype.hasOwnProperty.call(this._attrMap, name);
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

    get (name) {
        if (Object.prototype.hasOwnProperty.call(this._attrMap, name)) {
            return this._attrMap[name];
        }
    }

    getAttrMap () {
        return this._attrMap;
    }

    getAttrHint (name) {
        return ObjectHelper.getValue(name, this.ATTR_HINTS);
    }

    getBaseName () {
        return this.constructor.name;
    }

    getFormAttrId (name, prefix) {
        return prefix
            ? `${prefix}-${this.getBaseName()}-${name}`
            : `${this.getBaseName()}-${name}`;
    }

    getFormAttrName (name) {
        return `${this.getBaseName()}[${name}]`;
    }

    getSafeAttrNames () {
        const unsafeMap = this.getUnsafeAttrMap();
        const names = [];
        for (const name of this.getActiveAttrNames()) {
            if (unsafeMap[name] !== true) {
                names.push(name);
            }
        }
        return names;
    }

    getUnsafeAttrMap () {
        const data = {};
        for (const validator of this.getActiveValidatorsByClass(Validator.BUILTIN.unsafe)) {
            for (const attr of validator.attrs) {
                data[attr] = true;
            }
        }
        return data;
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

    set (name, value) {
        this._attrMap[name] = value;
    }

    setFromModel (name, model) {
        this._attrMap[name] = model.get(name);
    }

    setSafeAttrs (data) {
        if (data) {
            for (const name of this.getSafeAttrNames()) {
                if (Object.prototype.hasOwnProperty.call(data, name)) {
                    this.set(name, data[name]);
                }
            }
        }
    }

    setAttrs (data, except) {
        if (data instanceof Model) {
            data = data.getAttrMap();
        }
        if (data) {
            for (const key of Object.keys(data)) {
                if (Array.isArray(except) ? !except.includes(key) : (except !== key)) {
                    this._attrMap[key] = data[key];
                }
            }
        }
    }

    assign (data) {
        Object.assign(this._attrMap, data instanceof Model ? data.getAttrMap() : data);
    }

    unset (...names) {
        for (const name of names) {
            delete this._attrMap[name];
        }
    }

    // LABELS

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

    getAttrLabel (name) {
        return this.constructor.getAttrLabel(name);
    }

    getAttrValueLabel (name, data) {
        return ObjectHelper.getValueOrKey(this.get(name), data || this.ATTR_VALUE_LABELS[name]);
    }

    setAttrValueLabel (name, data) {
        this.setViewAttr(name, this.getAttrValueLabel(name, data));
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

    // LOAD

    load (data) {        
        if (data) {
            this.setSafeAttrs(data[this.getBaseName()]);
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
            await validator.validateModel(this);
        }
    }

    async validate (attrNames) {       
        await this.beforeValidate();
        attrNames = attrNames || this.getActiveAttrNames();
        for (const validator of this.getActiveValidators()) {
            await validator.validateModel(this, attrNames);
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

    hasError (attr) {
        return attr
            ? Object.prototype.hasOwnProperty.call(this._errorMap, attr)
            : Object.values(this._errorMap).length > 0;
    }

    getErrors (attr) {
        return !attr ? this._errorMap : this.hasError(attr) ? this._errorMap[attr] : [];
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
            const closest = FileHelper.getClosestDirectory(this.MODEL_DIRECTORY, this.CLASS_DIRECTORY);
            const dir = path.join(this.CONTROLLER_DIRECTORY, this.getNestedDirectory(), this.getControllerClassName());
            Object.defineProperty(this, '_CONTROLLER_CLASS', {
                value: require(path.join(path.dirname(closest), dir)),
                writable: false
            });
        }
        return this._CONTROLLER_CLASS;
    }

    static getControllerClassName () {
        return this.name + 'Controller';
    }

    static getNestedDirectory () {
        if (!this.hasOwnProperty('_NESTED_DIRECTORY')) {
            Object.defineProperty(this, '_NESTED_DIRECTORY', {
                value: FileHelper.getRelativePathByDirectory(this.MODEL_DIRECTORY, this.CLASS_DIRECTORY),
                writable: false
            });
        }
        return this._NESTED_DIRECTORY;
    }

    getControllerClass () {
        return this.constructor.getControllerClass();
    }

    createController (config) {
        return this.spawn(this.getControllerClass(), config);
    }
};
module.exports.init();

const FileHelper = require('../helper/FileHelper');
const ObjectHelper = require('../helper/ObjectHelper');
const StringHelper = require('../helper/StringHelper');
const Validator = require('../validator/Validator');
const path = require('path');