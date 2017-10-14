'use strict';

const Base = require('../base/Component');

module.exports = class I18n extends Base {

    static getConstants () {
        return {
            CORE_CATEGORY: 'areto',
            APP_CATEGORY: 'app',
            ASTERISK: '*'
        };
    }

    constructor (config) {
        super(Object.assign({
            language: config.parent ? config.parent.language : 'en',
            sourceLanguage: config.parent ? config.parent.sourceLanguage : 'en',
            MessageFormatter,
            sources: {},
            basePath: config.module.getPath('messages')
        }, config));
    }

    init () {
        for (let category of Object.keys(this.sources)) {
            this.sources[category] = this.createSource(category, this.sources[category]);
        }
        if (!this.sources[this.CORE_CATEGORY] && !this.sources[this.CORE_CATEGORY + this.ASTERISK]) {
            if (this.parent instanceof I18n) {
                this.sources[this.CORE_CATEGORY] = this.parent.sources[this.CORE_CATEGORY];
            } else {
                this.sources[this.CORE_CATEGORY] = this.createSource(this.CORE_CATEGORY, {
                    basePath: path.join(__dirname, 'messages')
                });
            }
        }
        if (!this.sources[this.APP_CATEGORY] && !this.sources[this.APP_CATEGORY + this.ASTERISK]) {
            this.sources[this.APP_CATEGORY] = this.createSource(this.APP_CATEGORY);
        }
        if (this.parent instanceof I18n) {
            for (let category of Object.keys(this.parent.sources)) {
                this.sources[category] = this.sources[category] || this.parent.sources[category];
            }
        }
        this.messageFormatter = ClassHelper.createInstance(this.MessageFormatter, {
            i18n: this
        });
    }

    translate (category, message, params, language) {
        let source = this.getMessageSource(category);
        if (!source) {
            return message;
        }
        language = language || this.language;
        let result = source.translate(category, message, language);
        return result === null
            ? this.format(message, params, source.sourceLanguage)
            : this.format(result, params, language);
    }

    format (message, params, language) {
        return params ? this.messageFormatter.format(message, params, language) : message;
    }

    getActiveNotSourceLanguage () {
        return this.language !== this.sourceLanguage ? this.language : null;
    }

    getMessageSource (category) {
        let sources = this.sources;
        if (sources.hasOwnProperty(category)) {
            if (!(sources[category] instanceof MessageSource)) {
                sources[category] = this.createSource(category, sources[category]);
            }
            return sources[category];
        }
        for (let name of Object.keys(sources)) {
            let pos = name.indexOf(this.ASTERISK);
            if (pos > 0 && name.substring(0, pos).indexOf(category) === 0) {
                if (!(sources[name] instanceof MessageSource)) {
                    sources[name] = this.createSource(name, sources[name]);
                    sources[category] = sources[name];
                }
                return sources[name];
            }
        }
        if (sources.hasOwnProperty(this.ASTERISK)) {
            if (!(sources[this.ASTERISK] instanceof MessageSource)) {
                sources[this.ASTERISK] = this.createSource(this.ASTERISK, sources[this.ASTERISK]);
            }
            return sources[this.ASTERISK];
        }
        this.log('error', `${this.constructor.name}: Unable to find message source for "${category}"`);
        return null;
    }

    createSource (category, data) {
        if (data instanceof MessageSource) {
            return data;
        }
        return ClassHelper.createInstance(Object.assign({
            Class: JsMessageSource,
            i18n: this,
            parent: this.getSourceParent(category)
        }, data));
    }

    getSourceParent (category) {
        return this.parent ? (this.parent.sources[category] || this.parent.getSourceParent(category)) : null;
    }
};
module.exports.init();

const path = require('path');
const ClassHelper = require('../helpers/ClassHelper');
const MessageSource = require('./MessageSource');
const JsMessageSource = require('./JsMessageSource');
const MessageFormatter = require('./MessageFormatter');