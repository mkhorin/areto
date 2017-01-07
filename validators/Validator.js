'use strict';

const Base = require('../base/Base');
const ArrayHelper = require('../helpers/ArrayHelper');
const async = require('async');

module.exports = class Validator extends Base {

    static getConstants () {
        return {
            BUILT_IN: {
                boolean: require('./BooleanValidator'),
                compare: require('./CompareValidator'),
                date: require('./DateValidator'),
                default: require('./DefaultValueValidator'),
                each: require('./EachValidator'),
                email: require('./EmailValidator'),
                exist: require('./ExistValidator'),
                file: require('./FileValidator'),
                filter: require('./FilterValidator'),
                image: require('./ImageValidator'),
                inline: require('./InlineValidator'),
                number: require('./NumberValidator'),
                range: require('./RangeValidator'),
                regexp: require('./RegexpValidator'),
                required: require('./RequiredValidator'),
                relation: require('./RelationValidator'),
                safe: require('./SafeValidator'),
                string: require('./StringValidator'),
                unique: require('./UniqueValidator'),
                url: require('./UrlValidator')
            }
        };
    }

    static createValidator (type, model, attrs, config = {}) {
        config.attrs = attrs instanceof Array ? attrs : [attrs];
        if (typeof type === 'function' || typeof model[type] === 'function') {
            if (Object.getPrototypeOf(type) !== Validator) {
                config.method = type;
                type = this.BUILT_IN.inline;
            }
        } else if (Object.prototype.hasOwnProperty.call(this.BUILT_IN, type)) {
            type = this.BUILT_IN[type];
        } else {
            throw new Error(`Validator: Invalid type: ${type}`);
        }
        return new type(config);
    }

    constructor (config) {
        super(Object.assign({
            attrs: [],
            // on: [] // only scenarious
            // except: [] // excepted scenarious
            skipOnError: true,
            skipOnAnyError: false,
            skipOnEmpty: true,
            enableClientValidation: true,
            checkEmpty: null,
            when: null,
            whenClient: null
        }, config));
    }

    createMessage (msgAttr, message) {
        if (!(this[msgAttr] instanceof Message)) {
            this[msgAttr] = this[msgAttr] ? new Message(null, this[msgAttr]) : new Message('core', message);
        }
        return this[msgAttr];
    }

    validateAttrs (model, attrs, cb) {
        attrs = attrs instanceof Array ? ArrayHelper.intersect(attrs, this.attrs) : this.attrs;
        attrs = attrs.filter(attr => {
            return (!this.skipOnAnyError || !model.hasError())
                && (!this.skipOnError || !model.hasError(attr))
                && (!this.skipOnEmpty || !this.isEmpty(model.get(attr)))
                && (typeof this.when !== 'function' || this.when(model, attr));
        });
        async.each(attrs, (attr, cb)=>{
            this.validateAttr(model, attr, cb);
        }, cb);
    }

    validateAttr (model, attr, cb) {
        this.validateValue(model.get(attr), (err, message, params)=> {
            message && this.addError(model, attr, message, params);
            cb(err);
        });
    }

    validateValue (value, cb) {
        cb('Validator must override this method');
    }

    isActive (scenario) {
        return scenario
            ? (!this.except || !this.except.includes(scenario)) && (!this.on || this.on.includes(scenario))
            : !this.on;
    }

    isEmpty (value) {
        return typeof this.checkEmpty === 'function' 
            ? this.checkEmpty(value)
            : typeof value === 'undefined' || value === null || value === '' || value.length === 0;
    }

    addError (model, attr, message, params) {
        if (params) {
            message.addParams(params);
        }
        let value = model.get(attr);
        message.addParams({
            attr: model.getLabel(attr),
            value: value instanceof Array ? 'array[]' : value
        });
        model.addError(attr, message);
    }
};
module.exports.init();

const Message = require('../i18n/Message');