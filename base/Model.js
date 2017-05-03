'use strict';

const Base = require('./Component');
const InflectorHelper = require('../helpers/InflectorHelper');
const ArrayHelper = require('../helpers/ArrayHelper');
const async = require('async');

module.exports = class Model extends Base {

    static getConstants () {
        return {
            ID: this.getId(),
            RULES: [
                // [['attr1', 'attr2'], '{type}', {...params}]
                // [['attr1', 'attr2'], '{model method name}']
                // [['attr1', 'attr2'], {validator class} ]
            ],
            LABELS: {},
            HINTS: {},
            EVENT_BEFORE_VALIDATE: 'beforeValidate',
            EVENT_AFTER_VALIDATE: 'afterValidate'
        }   
    }

    static getId () {
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

    hasAttr (name) {
        return Object.prototype.hasOwnProperty.call(this._attrs, name);
    }

    deleteAttr (name) {
        delete this._attrs[name];
    }
    
    isAttrRequired (name) {
        for (let validator of this.getActiveValidators(name)) {
            if (validator instanceof RequiredValidator && validator.when === null) {
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
        return Object.prototype.hasOwnProperty.call(this.LABELS, name) ? this.LABELS[name] : this.generateLabel(name);
    }

    getHint (name) {
        return Object.prototype.hasOwnProperty.call(this.HINTS, name) ? this.HINTS[name] : '';
    }

    getFormAttrId (name, prefix) {
        return prefix ? `${prefix}-${this.ID}-${name}` : `${this.ID}-${name}`;
    }

    getFormAttrName (name) {
        return `${this.ID}[${name}]`;
    }

    getAttrNames () {
        return Object.keys(this._attrs);
    }

    getSafeAttrNames () {
        let names = [];
        for (let name of this.getScenarioAttrs(this.scenario)) {
            if (name.charAt(0) !== '!') {
                names.push(name);
            }
        }
        return names;
    }

    getActiveAttrNames () {
        let names = this.getScenarioAttrs(this.scenario);
        for (let i = 0; i < names.length; ++i) {
            if (names[i].charAt(0) === '!') {
                names[i] = names[i].substring(1);
            }
        }
        return names;
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
        if (values && typeof values === 'object') {
            for (let name of this.getSafeAttrNames()) {
                if (Object.prototype.hasOwnProperty.call(values, name)) {
                    this.set(name, values[name]);
                }
            }    
        }
    }

    assignAttrs (model) {
        if (model instanceof Model) {
            this.setAttrs(model._attrs);
        }
    }
    
    setAttrs (values) {
        if (values && typeof values === 'object') {
            for (let name of Object.keys(values)) {
                this.set(name, values[name]);
            }
        }
    }

    getScenarioAttrs (scenario) {
        let attrs = {};
        for (let validator of this.getValidators()) {
            if (validator.isActive(scenario)) {
                for (let attr of validator.attrs) {
                    attrs[attr] = true;
                }
            }
        }
        return Object.keys(attrs);
    }

    generateLabel (name) {
        this.LABELS[name] = InflectorHelper.camelToWords(InflectorHelper.camelize(name));
        return this.LABELS[name];
    }

    // ERRORS

    hasError (attr) {
        return attr ? Object.prototype.hasOwnProperty.call(this._errors, attr) : Object.keys(this._errors).length > 0;
    }

    getErrors (attr) {
        return attr ? (Object.prototype.hasOwnProperty.call(this._errors, attr) ? this._errors[attr] : []) : this._errors;
    }

    getFirstError (attr) {
        if (attr) {
            return Object.prototype.hasOwnProperty.call(this._errors, attr) ? this._errors[attr][0] : '';
        }
        for (attr in this._errors) {
            if (this._errors[attr] && this._errors[attr].length) {
                return this._errors[attr][0];
            }
        }
        return '';
    }

    getFirstErrors () {
        let errors = {};
        for (let attr of Object.keys(this._errors)) {
            let err = this._errors[attr]; 
            if (err instanceof Array && err.length) {
                errors[attr] = err[0];
            }
        }
        return errors;
    }

    addError (attr, error) {
        if (!Object.prototype.hasOwnProperty.call(this._errors, attr)) {
            this._errors[attr] = [];
        }
        this._errors[attr].push(error instanceof Message ? error : new Message(null, error));
    }

    addErrors (items) {
        for (let atrr in items) {
            let errors = items[attr];
            if (errors instanceof Array) {
                for (let error of errors) {
                    this.addError(attr, error);
                }
            } else {
                this.addError(attr, errors);
            }
        }
    }

    clearErrors (attr) {
        attr ? delete this._errors[attr] : this._errors = {};
    }

    // LOAD

    load (data) {        
        if (data) {
            this.setSafeAttrs(data[this.ID]);
        }
        return this;
    }

    loadMultiple (models, data) {        
        // TODO...
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
        async.series([
            this.beforeValidate.bind(this),
            cb => async.eachSeries(this.getActiveValidators(), (validator, cb)=> {
                validator.validateAttrs(this, attrNames, cb);
            }, cb),
            this.afterValidate.bind(this)
        ], cb);
    }

    createValidators () {
        let validators = [];
        for (let rule of this.RULES) {
            if (rule instanceof Validator) {
                validators.push(rule);
            } else if (rule instanceof Array && rule[0] && rule[1]) {
                validators.push(Validator.createValidator(rule[1], this, rule[0], rule[2]));
            } else {
                this.module.log('error', `${this.constructor.name}: Invalid validation rule`);
            }    
        }
        return validators;
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

    getActiveRelationNames () {
        let names = [];
        for (let validator of this.getValidators()) {
            if (validator instanceof RelationValidator && validator.isActive(this.scenario)) {
                names = names.concat(validator.attrs);
            }
        }
        return ArrayHelper.unique(names);
    }

    setDefaultValues (cb) {
        async.each(this.getActiveValidatorsByClass(DefaultValueValidator), (validator, cb)=> {
            validator.validateAttrs(this, null, cb);
        }, cb);
    }

    // DEFAULT CONTROLLER

    getDefaultController () {
        return require(this.module.getPath('controllers', `${this.ID}Controller`));
    }

    createDefaultController () {
        return new (this.getDefaultController());
    }
};

const Message = require('../i18n/Message');
const Validator = require('../validators/Validator');
const DefaultValueValidator = require('../validators/DefaultValueValidator');
const RequiredValidator = require('../validators/RequiredValidator');
const RelationValidator = require('../validators/RelationValidator');