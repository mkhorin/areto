'use strict';

const Base = require('./Component');
const inflector = require('../helpers/InflectorHelper');
const arrayHelper = require('../helpers/ArrayHelper');
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
        this._attributes = {};
        this._errors = {};
        this._validators = null;
    }

    // ATTRIBUTES

    get (name) {
        return this._attributes[name];
    }

    set (name, value) {
        this._attributes[name] = value;
    }

    hasAttribute (name) {
        return name in this._attributes;
    }
    
    isAttributeRequired (name) {
        for (let validator of this.getActiveValidators(name)) {
            if (validator instanceof RequiredValidator && validator.when === null) {
                return true;
            }
        }
        return false;
    }

    isAttributeSafe (name) {
        return this.getSafeAttributeNames().includes(name);
    }

    isAttributeActive (name) {
        return this.getActiveAttributeNames().includes(name);
    }

    getLabel (name) {
        return name in this.LABELS ? this.LABELS[name] : this.generateLabel(name);
    }

    getHint (name) {
        return name in this.HINTS ? this.HINTS[name] : '';
    }

    getFormAttributeId (name, prefix) {
        return prefix ? `${prefix}-${this.ID}-${name}` : `${this.ID}-${name}`;
    }

    getFormAttributeName (name) {
        return `${this.ID}[${name}]`;
    }

    getAttributeNames () {
        return Object.keys(this._attributes);
    }

    getSafeAttributeNames () {
        let names = [];
        for (let name of this.getScenarioAttributes(this.scenario)) {
            if (name.charAt(0) !== '!') {
                names.push(name);
            }
        }
        return names;
    }

    getActiveAttributeNames () {
        let names = this.getScenarioAttributes(this.scenario);
        for (let i = 0; i < names.length; ++i) {
            if (names[i].charAt(0) === '!') {
                names[i] = names[i].substring(1);
            }
        }
        return names;
    }

    getAttributes (names, except) {
        let values = {};
        if (!names) {
            names = this.getAttributeNames();
        }
        for (let name of names) {
            values[name] = this._attributes[name];
        }
        if (except instanceof Array) {
            for (let name of except) {
                delete values[name];
            }
        }
        return values;
    }

    setSafeAttributes (values) {
        if (values && typeof values === 'object') {
            for (let name of this.getSafeAttributeNames()) {
                if (name in values) {
                    this.set(name, values[name]);
                }
            }    
        }
    }

    assignAttributes (model) {        
        Object.assign(this._attributes, model._attributes);
    }
    
    setAttributes (values) {
        if (values && typeof values === 'object') {
            for (let name of Object.keys(values)) {
                this.set(name, values[name]);
            }
        }
    }

    getScenarioAttributes (scenario) {
        let attrs = {};
        for (let validator of this.getValidators()) {
            if (validator.isActive(scenario)) {
                for (let attr of validator.attributes) {
                    attrs[attr] = true;
                }
            }
        }
        return Object.keys(attrs);
    }

    generateLabel (name) {
        this.LABELS[name] = inflector.camelToWords(inflector.camelize(name));
        return this.LABELS[name];
    }

    // ERRORS

    hasError (attr) {
        return attr ? attr in this._errors : Object.keys(this._errors).length > 0;
    }

    getErrors (attr) {
        return attr ? (attr in this._errors ? this._errors[attr] : []) : this._errors;
    }

    getFirstError (attr) {
        if (attr) {
            return attr in this._errors ? this._errors[attr][0] : '';
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
        if (!(attr in this._errors)) {
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
        data && this.setSafeAttributes(data[this.ID]);
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
        this.beforeValidate(err => {
            if (err) {
                return cb(err);
            }
            if (!attrNames) {
                attrNames = this.getActiveAttributeNames();
            }
            async.eachSeries(this.getActiveValidators(), (validator, cb)=> {
                validator.validateAttrs(this, attrNames, cb);
            }, err => {
                err ? cb(err) : this.afterValidate(cb);
            });
        });
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
            return validator instanceof Class && (!attr || validator.attributes.includes(attr));
        });
    }

    getActiveValidators (attr) {
        return this.getValidators().filter(validator => {
            return validator.isActive(this.scenario) && (!attr || validator.attributes.includes(attr));
        });
    }

    getActiveRelationNames () {
        let names = [];
        for (let validator of this.getValidators()) {
            if (validator instanceof RelationValidator && validator.isActive(this.scenario)) {
                names = names.concat(validator.attributes);
            }
        }
        return arrayHelper.unique(names);
    }

    setDefaultValues (cb) {
        async.each(this.getActiveValidators().filter(item => item instanceof DefaultValueValidator), (item, cb)=> {
            item.validateAttrs(this, null, cb);
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