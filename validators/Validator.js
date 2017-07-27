'use strict';

const Base = require('../base/Base');

module.exports = class Validator extends Base {

    static getConstants () {
        return {
            BUILTIN: {
                'boolean': require('./BooleanValidator'),
                'compare': require('./CompareValidator'),
                'date': require('./DateValidator'),
                'default': require('./DefaultValueValidator'),
                'each': require('./EachValidator'),
                'email': require('./EmailValidator'),
                'exist': require('./ExistValidator'),
                'file': require('./FileValidator'),
                'filter': require('./FilterValidator'),
                'image': require('./ImageValidator'),
                'inline': require('./InlineValidator'),
                'ip': require('./IpValidator'),
                'mongoId': require('./MongoIdValidator'),
                'number': require('./NumberValidator'),
                'range': require('./RangeValidator'),
                'regexp': require('./RegExpValidator'),
                'required': require('./RequiredValidator'),
                'relation': require('./RelationValidator'),
                'safe': require('./SafeValidator'),
                'string': require('./StringValidator'),
                'unique': require('./UniqueValidator'),
                'url': require('./UrlValidator')
            }
        };
    }

    static createValidator (type, model, attrs, config = {}) {
        config.attrs = attrs instanceof Array ? attrs : [attrs];
        if (typeof type === 'function' || typeof model[type] === 'function') {
            if (!(type.prototype instanceof Validator)) {
                config.method = type;
                type = this.BUILTIN.inline;
            }
        } else if (Object.prototype.hasOwnProperty.call(this.BUILTIN, type)) {
            type = this.BUILTIN[type];
        } else {
            throw new Error(`${this.name}: Invalid type: ${type}`);
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
            isEmpty: null, // value => false/true
            when: null, // (model, attr)=> false/true
            whenClient: null
        }, config));
    }

    createMessage (msgAttr, message, params) {
        if (!(this[msgAttr] instanceof Message)) {
            this[msgAttr] = this[msgAttr] ? new Message(null, this[msgAttr], params)
                : new Message('areto', message, params);
        }
        return this[msgAttr];
    }

    validateAttrs (model, attrs, cb) {
        attrs = attrs instanceof Array ? ArrayHelper.intersect(attrs, this.attrs) : this.attrs;
        attrs = attrs.filter(attr => {
            return (!this.skipOnAnyError || !model.hasError())
                && (!this.skipOnError || !model.hasError(attr))
                && (!this.skipOnEmpty || !this.isEmptyValue(model.get(attr)))
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
        cb(`${this.constructor.name}: Need to override`);
    }

    isActive (scenario) {
        return scenario
            ? (!this.except || !this.except.includes(scenario)) && (!this.on || this.on.includes(scenario))
            : !this.on;
    }

    isEmptyValue (value) {
        return typeof this.isEmpty === 'function'
            ? this.isEmpty(value)
            : value === undefined || value === null || value.length === 0;
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

const async = require('async');
const ArrayHelper = require('../helpers/ArrayHelper');
const Message = require('../i18n/Message');