/**
 * @copyright Copyright (c) 2018 Maxim Khorin (maksimovichu@gmail.com)
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
        let only = this.SCENARIOS[scenario] instanceof Array
            ? this.SCENARIOS[scenario]
            : this.SCENARIOS[this.DEFAULT_SCENARIO];
        for (let validator of this.getValidators()) {
            if (validator.isActive(scenario)) {
                for (let name of validator.attrs) {
                    if (!(only instanceof Array) || only.includes(name)) {
                        names[name] = true;
                    }
                }
            }
        }
        return Object.keys(names);
    }

    getAttrs () {
        return Object.assign({}, this._attrs);
    }

    getAttrsByNames (names) {
        let values = {};
        for (let name of names) {
            values[name] = this._attrs[name];
        }
        return values;
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
                if (except instanceof Array ? !except.includes(key) : (except !== key)) {
                    this._attrs[key] = data[key];
                }
            }
        }
    }

    assignAttrs (data) {
        Object.assign(this._attrs, data instanceof Model ? data._attrs : data);
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
        this.ATTR_LABELS[name] = StringHelper.camelToWords(StringHelper.camelize(name));
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
                if (data[attr] instanceof Array) {
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
        // await super.beforeValidate() if override this method
        return this.triggerWait(this.EVENT_BEFORE_VALIDATE);
    }

    afterValidate () {
        // await super.afterValidate() if override this method
        return this.triggerWait(this.EVENT_AFTER_VALIDATE);
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

    addValidator (rule) {
        rule = this.createValidator(rule);
        if (rule) {
            this.getValidators().push(rule);
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
        if (rule instanceof Array && rule[0] && rule[1]) {
            return Validator.createValidator(rule[1], this, rule[0], rule[2]);
        }
        this.log('error', 'Invalid validation rule', rule);
    }

    // MODEL CONTROLLER

    getControllerClass () {
        return require(this.module.getPath('controller', `${this.NAME}Controller`));
    }

    createController (params) {
        return new (this.getControllerClass())(params);
    }
};
module.exports.init();

const ObjectHelper = require('../helper/ObjectHelper');
const StringHelper = require('../helper/StringHelper');
const Validator = require('../validator/Validator');