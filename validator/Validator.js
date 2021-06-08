/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Validator extends Base {

    static getConstants () {
        return {
            BUILTIN: {
                'boolean': require('./BooleanValidator'),
                'checkbox': require('./CheckboxValidator'),
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
                'integer': require('./IntegerValidator'),
                'id': require('./IdValidator'),
                'ip': require('./IpValidator'),
                'json': require('./JsonValidator'),
                'number': require('./NumberValidator'),
                'range': require('./RangeValidator'),
                'regex': require('./RegexValidator'),
                'required': require('./RequiredValidator'),
                'relation': require('./RelationValidator'),
                'safe': require('./SafeValidator'),
                'spawn': require('./SpawnValidator'),
                'string': require('./StringValidator'),
                'unique': require('./UniqueValidator'),
                'unsafe': require('./UnsafeValidator'),
                'url': require('./UrlValidator')
            }
        };
    }

    static createValidator (type, model, attrs, config = {}) {
        let Class = type;
        if (Object.prototype.hasOwnProperty.call(this.BUILTIN, type)) {
            Class = this.BUILTIN[type];
        } else if (typeof type === 'function' || typeof model[type] === 'function') {
            if (!(Class.prototype instanceof Validator)) {
                config.method = type;
                Class = this.BUILTIN.inline;
            }
        } else if (type instanceof Object) {
            Object.assign(config, type);
            Class = type.Class;
        }
        if (typeof Class === 'string') {
            Class = model.getClass(type);
        }
        if (!Class || !(Class.prototype instanceof Validator)) {
            throw new Error(`Invalid type: ${type}`);
        }
        config.attrs = Array.isArray(attrs) ? attrs : [attrs];
        config.module = model.module;
        return new Class(config);
    }

    constructor (config) {
        super({
            // on: [] // only scenarios
            // except: [] // excepted scenarios
            attrs: [],
            skipOnError: true,
            skipOnAnyError: false,
            skipOnEmpty: true,
            when: null, // (model, attr) => false/true
            isEmpty: null, // value => false/true
            messageSource: 'app',
            defaultMessageSource: 'areto',
            ...config
        });
    }

    createMessage (message, defaultMessage, params) {
        if (message instanceof Message) {
            return message.addParams(params);
        }
        if (message) {
            return new Message(this.messageSource, message, params);
        }
        if (defaultMessage instanceof Message) {
            return defaultMessage.addParams(params);
        }
        return new Message(this.defaultMessageSource, defaultMessage, params);
    }

    async validateModel (model, attrs) {
        attrs = Array.isArray(attrs)
            ? ArrayHelper.intersect(attrs, this.attrs)
            : this.attrs;
        attrs = attrs.filter(attr => {
            return (!this.skipOnAnyError || !model.hasError())
                && (!this.skipOnError || !model.hasError(attr))
                && (!this.skipOnEmpty || !this.isEmptyValue(model.get(attr)))
                && (typeof this.when !== 'function' || this.when(model, attr));
        });
        for (const attr of attrs) {
            await this.validateAttr(attr, model);
        }
    }

    async validateAttr (attr, model) {
        const message = await this.validateValue(model.get(attr));
        if (message) {
            this.addError(model, attr, message);
        }
    }

    validateValue () {
        throw new Error('Need to override');
    }

    isActive (scenario) {
        return scenario
            ? (!this.except || !this.except.includes(scenario)) && (!this.on || this.on.includes(scenario))
            : !this.on;
    }

    isEmptyValue (value) {
        return typeof this.isEmpty === 'function'
            ? this.isEmpty(value)
            : value === undefined || value === null || value === '';
    }

    addError (model, attr, message) {
        const value = model.get(attr);
        message.addParams({
            attr: model.getAttrLabel(attr),
            value: Array.isArray(value) ? value.join() : value
        });
        model.addError(attr, message);
    }

    log () {
        CommonHelper.log(this.module, this.constructor.name, ...arguments);
    }
};
module.exports.init();

const CommonHelper = require('../helper/CommonHelper');
const ArrayHelper = require('../helper/ArrayHelper');
const Message = require('../i18n/Message');