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
                'id': require('./IdValidator'),
                'ip': require('./IpValidator'),
                'number': require('./NumberValidator'),
                'range': require('./RangeValidator'),
                'regexp': require('./RegExpValidator'),
                'required': require('./RequiredValidator'),
                'relation': require('./RelationValidator'),
                'safe': require('./SafeValidator'),
                'spawn': require('./SpawnValidator'),
                'string': require('./StringValidator'),
                'unique': require('./UniqueValidator'),
                'unsafe': require('./UnsafeValidator'),
                'url': require('./UrlValidator')
            },
            DEFAULT_MESSAGE_CATEGORY: 'areto'
        };
    }

    static createValidator (type, model, attrs, config = {}) {
        if (Object.prototype.hasOwnProperty.call(this.BUILTIN, type)) {
            type = this.BUILTIN[type];
        } else if (typeof type === 'function' || typeof model[type] === 'function') {
            if (!(type.prototype instanceof Validator)) {
                config.method = type;
                type = this.BUILTIN.inline;
            }
        } else if (type) {
            Object.assign(config, type);
            type = type.Class;
        }
        if (!type || !(type.prototype instanceof Validator)) {
            throw new Error(this.wrapClassMessage(`Invalid type`));
        }
        config.attrs = Array.isArray(attrs) ? attrs : [attrs];
        return new type(config);
    }

    constructor (config) {
        super({
            // on: [] // only scenarios
            // except: [] // excepted scenarios
            attrs: [],
            skipOnError: true,
            skipOnAnyError: false,
            skipOnEmpty: true,
            when: null, // (model, attr)=> false/true
            isEmpty: null, // value => false/true
            messageCategory: 'app',
            // enableClientValidation: true,
            // whenClient: null,
            ...config
        });
    }

    createMessage (message, defaultMessage, params) {
        if (message instanceof Message) {
            return message.addParams(params);
        }
        if (typeof message === 'string') {
            return new Message(message, this.messageCategory, params);
        }
        const category = ObjectHelper.getKeyByValue(this.constructor, this.BUILTIN)
            ? this.DEFAULT_MESSAGE_CATEGORY
            : this.messageCategory;
        return new Message(defaultMessage, category, params);
    }

    async validateAttrs (model, attrs) {
        attrs = Array.isArray(attrs)
            ? ArrayHelper.intersect(attrs, this.attrs)
            : this.attrs;
        attrs = attrs.filter(attr => {
            return (!this.skipOnAnyError || !model.hasError())
                && (!this.skipOnError || !model.hasError(attr))
                && (!this.skipOnEmpty || !this.isEmptyValue(model.get(attr)))
                && (typeof this.when !== 'function' || this.when(model, attr));
        });
        for (let attr of attrs) {
            await this.validateAttr(model, attr);
        }
    }

    async validateAttr (model, attr) {
        let message = await this.validateValue(model.get(attr));
        if (message) {
            this.addError(model, attr, message);
        }
    }

    validateValue () {
        throw new Error(this.wrapClassMessage('Need to override'));
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

    addError (model, attr, message) {
        let value = model.get(attr);
        message.addParams({
            attr: model.getAttrLabel(attr),
            value: Array.isArray(value) ? value.join() : value
        });
        model.addError(attr, message);
    }
};
module.exports.init();

const ArrayHelper = require('../helper/ArrayHelper');
const ObjectHelper = require('../helper/ObjectHelper');
const Message = require('../i18n/Message');