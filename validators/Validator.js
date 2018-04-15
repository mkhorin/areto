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
                'string': require('./StringValidator'),
                'unique': require('./UniqueValidator'),
                'url': require('./UrlValidator')
            },
            DEFAULT_MESSAGE_CATEGORY: 'areto'
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
            // on: [] // only scenarios
            // except: [] // excepted scenarios
            skipOnError: true,
            skipOnAnyError: false,
            skipOnEmpty: true,
            enableClientValidation: true,
            isEmpty: null, // value => false/true
            when: null, // (model, attr)=> false/true
            whenClient: null,
            messageCategory: 'app'
        }, config));
    }

    createMessage (message, defaultMessage, params) {
        if (message instanceof Message) {
            return message.addParams(params);
        }
        if (typeof message === 'string') {
            return new Message(this.messageCategory, message, params);
        }
        let category = ObjectHelper.getValueKey(this.constructor, this.BUILTIN)
            ? this.DEFAULT_MESSAGE_CATEGORY
            : this.messageCategory;
        return new Message(category, defaultMessage, params);
    }

    validateAttrs (model, attrs, cb) {
        attrs = attrs instanceof Array ? ArrayHelper.intersect(attrs, this.attrs) : this.attrs;
        attrs = attrs.filter(attr => {
            return (!this.skipOnAnyError || !model.hasError())
                && (!this.skipOnError || !model.hasError(attr))
                && (!this.skipOnEmpty || !this.isEmptyValue(model.get(attr)))
                && (typeof this.when !== 'function' || this.when(model, attr));
        });
        AsyncHelper.eachSeries(attrs, (attr, cb)=>{
            this.validateAttr(model, attr, cb);
        }, cb);
    }

    validateAttr (model, attr, cb) {
        this.validateValue(model.get(attr), (err, message)=> {
            if (message) {
                this.addError(model, attr, message);
            }
            cb(err);
        });
    }

    validateValue (value, cb) {
        cb(this.wrapClassMessage('Need to override'));
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
            attr: model.getLabel(attr),
            value: value instanceof Array ? 'array[]' : value
        });
        model.addError(attr, message);
    }
};
module.exports.init();

const AsyncHelper = require('../helpers/AsyncHelper');
const ArrayHelper = require('../helpers/ArrayHelper');
const ObjectHelper = require('../helpers/ObjectHelper');
const Message = require('../i18n/Message');