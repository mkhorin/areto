'use strict';

const Base = require('./Component');

module.exports = class Model extends Base {

    static getExtendedProperties () {
        return [
            'BEHAVIORS',
            'SCENARIOS',
            'LABELS',
            'HINTS'
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
                // [['!attr1'], '{type}' ] - attr1 unsafe to load
            ],
            SCENARIOS: {
                // scenario1: ['attr1', '!attr2'] - attr2 unsafe to load
                // scenario2: ['attr2', 'attr3']
            },
            LABELS: {},
            HINTS: {},
            EVENT_BEFORE_VALIDATE: 'beforeValidate',
            EVENT_AFTER_VALIDATE: 'afterValidate'
        }   
    }

    static getName () {
        return this.name;
    }

    init () {
        super.init();
        this._attrs = {};
        this._errors = {};
        this._validators = null;
    }

    // ATTRIBUTES

    get (name) {
        return this._attrs[name];
    }

    set (name, value) {
        this._attrs[name] = value;
    }

    unset (name) {
        return delete this._attrs[name];
    }

    unsetAttrs (names) {
        for (let name of names) {
            this.unset(name);
        }
    }

    hasAttr (name) {
        return Object.prototype.hasOwnProperty.call(this._attrs, name);
    }

    isAttrRequired (name) {
        for (let validator of this.getActiveValidators(name)) {
            if (validator instanceof Validator.BUILTIN.required && validator.when === null) {
                return true;
            }
        }
        return false;
    }

    isAttrSafe (name) {
        return this.getSafeAttrNames().includes(name);
    }

    isAttrActive (name) {
        return this.getActiveAttrNames().includes(name);
    }

    getLabel (name) {
        return Object.prototype.hasOwnProperty.call(this.LABELS, name)
            ? this.LABELS[name]
            : this.generateLabel(name);
    }

    getHint (name) {
        return Object.prototype.hasOwnProperty.call(this.HINTS, name)
            ? this.HINTS[name]
            : '';
    }

    getFormAttrId (name, prefix) {
        return prefix ? `${prefix}-${this.NAME}-${name}` : `${this.NAME}-${name}`;
    }

    getFormAttrName (name) {
        return `${this.NAME}[${name}]`;
    }

    getAttrNames () {
        return Object.keys(this._attrs);
    }

    getSafeAttrNames () {
        return this.getScenarioAttrNames(this.scenario).filter(name => name.charAt(0) !== '!');
    }

    getActiveAttrNames () {
        let names = this.getScenarioAttrNames(this.scenario);
        for (let i = 0; i < names.length; ++i) {
            if (names[i].charAt(0) === '!') {
                names[i] = names[i].substring(1);
            }
        }
        return names;
    }

    getScenarioAttrNames (scenario) {
        let names = {}, only;
        if (this.SCENARIOS && this.SCENARIOS[scenario] instanceof Array) {
            only = this.SCENARIOS[scenario];
        }
        for (let validator of this.getValidators()) {
            if (validator.isActive(scenario)) {
                for (let name of validator.attrs) {
                    if (!only || only.includes(name)) {
                        names[name] = true;
                    }
                }
            }
        }
        return Object.keys(names);
    }

    getAttrs (names, except) {
        let values = {};
        if (!names) {
            names = this.getAttrNames();
        }
        for (let name of names) {
            values[name] = this._attrs[name];
        }
        if (except instanceof Array) {
            for (let name of except) {
                delete values[name];
            }
        }
        return values;
    }

    setSafeAttrs (values) {
        if (values) {
            for (let name of this.getSafeAttrNames()) {
                if (Object.prototype.hasOwnProperty.call(values, name)) {
                    this.set(name, values[name]);
                }
            }    
        }
    }

    setAttrs (values, except) {
        values = values instanceof Model ? values._attrs : values;
        if (values) {
            for (let key of Object.keys(values)) {
                if (except instanceof Array ? !except.includes(key) : (except !== key)) {
                    this._attrs[key] = values[key];
                }
            }
        }
    }

    assignAttrs (values) {
        Object.assign(this._attrs, values instanceof Model ? values._attrs : values);
    }

    generateLabel (name) {
        this.LABELS[name] = StringHelper.camelToWords(StringHelper.camelize(name));
        return this.LABELS[name];
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
        let errors = {};
        for (let attr of Object.keys(this._errors)) {
            if (this._errors[attr].length) {
                errors[attr] = this._errors[attr][0];
            }
        }
        return errors;
    }

    addError (attr, error) {
        if (!this.hasError(attr)) {
            this._errors[attr] = [];
        }
        this._errors[attr].push(error instanceof Message ? error : new Message(null, error));
    }

    addErrors (items) {
        for (let attr of Object.keys(items)) {
            if (items[attr] instanceof Array) {
                for (let error of items[attr]) {
                    this.addError(attr, error);
                }
            } else {
                this.addError(attr, items[attr]);
            }
        }
    }

    clearErrors (attr) {
        attr ? delete this._errors[attr] : this._errors = {};
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

    beforeValidate (cb) {
        // if override this method then call super.beforeValidate(cb)
        this.triggerCallback(this.EVENT_BEFORE_VALIDATE, cb);
    }

    afterValidate (cb) {
        // if override this method then call super.afterValidate(cb);
        this.triggerCallback(this.EVENT_AFTER_VALIDATE, cb);
    }

    // VALIDATE

    validate (cb, attrNames) {
        attrNames = attrNames || this.getActiveAttrNames();
        AsyncHelper.series([
            this.beforeValidate.bind(this),
            cb => AsyncHelper.eachSeries(this.getActiveValidators(), (validator, cb)=> {
                validator.validateAttrs(this, attrNames, cb);
            }, cb),
            this.afterValidate.bind(this)
        ], cb);
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

    setDefaultValues (cb) {
        AsyncHelper.eachSeries(this.getActiveValidatorsByClass(Validator.BUILTIN.default), (validator, cb)=> {
            validator.validateAttrs(this, null, cb);
        }, cb);
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
        this.log('error', this.wrapClassMessage('Invalid validation rule'), rule);
    }

    // MODEL CONTROLLER

    getController () {
        return require(this.module.getPath('controllers', `${this.NAME}Controller`));
    }

    createController (params) {
        return new (this.getController())(params);
    }
};
module.exports.init();

const AsyncHelper = require('../helpers/AsyncHelper');
const ArrayHelper = require('../helpers/ArrayHelper');
const StringHelper = require('../helpers/StringHelper');
const Message = require('../i18n/Message');
const Validator = require('../validators/Validator');