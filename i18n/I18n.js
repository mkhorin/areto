/**
 * @copyright Copyright (c) 2018 Maxim Khorin (maksimovichu@gmail.com)
 */
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
            'language': config.parent ? config.parent.language : 'en',
            'sourceLanguage': config.parent ? config.parent.sourceLanguage : 'en',
            'sources': {},
            'basePath': config.module.getPath('message'),
            'MessageFormatter': MessageFormatter
        }, config)); 
        
        this.createSources();
        this.createMessageFormatter();
    }

    createSources () {
        let sources = this.sources || {};
        for (let category of Object.keys(sources)) {
            sources[category] = this.createSource(category, sources[category]);
        }
        if (!sources[this.CORE_CATEGORY] && !sources[this.CORE_CATEGORY + this.ASTERISK]) {
            if (this.parent instanceof I18n) {
                sources[this.CORE_CATEGORY] = this.parent.sources[this.CORE_CATEGORY];
            } else {
                sources[this.CORE_CATEGORY] = this.createSource(this.CORE_CATEGORY, {
                    basePath: path.join(__dirname, 'message')
                });
            }
        }
        if (!sources[this.APP_CATEGORY] && !sources[this.APP_CATEGORY + this.ASTERISK]) {
            sources[this.APP_CATEGORY] = this.createSource(this.APP_CATEGORY);
        }
        if (this.parent instanceof I18n) {
            for (let category of Object.keys(this.parent.sources)) {
                sources[category] = sources[category] || this.parent.sources[category];
            }
        }
        this.sources = sources;
    }

    createSource (category, data) {
        if (data instanceof MessageSource) {
            return data;
        }
        return ClassHelper.createInstance(Object.assign({
            Class: JsMessageSource,
            parent: this.getSourceParent(category),
            i18n: this
        }, data));
    }

    getSourceParent (category) {
        return this.parent ? (this.parent.sources[category] || this.parent.getSourceParent(category)) : null;
    }

    createMessageFormatter () {
        this.messageFormatter = ClassHelper.createInstance(this.MessageFormatter, {
            i18n: this
        });
    }

    format (message, params, language) {
        return params
            ? this.messageFormatter.format(message, params, language)
            : message;
    }

    translate (message, category, params, language) {
        let source = this.getMessageSource(category);
        if (!source) {
            return message;
        }
        language = language || this.language;
        let result = source.translate(message, category, language);
        return result === null
            ? this.format(message, params, source.sourceLanguage)
            : this.format(result, params, language);
    }

    translateMessageMap (map, category) {
        map = Object.assign({}, map);
        for (let key of Object.keys(map)) {
            map[key] = this.translateMessage(map[key], category);
        }
        return map;
    }

    translateMessage (message, category) {
        if (message instanceof Array) {
            return this.translate.apply(this, message);
        }
        if (message instanceof Message) {
            return message.translate(this);
        }
        return this.translate.apply(this, arguments);
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
        this.log('error', `Not found message source: ${category}`);
        return null;
    }
};
module.exports.init();

const path = require('path');
const ClassHelper = require('../helper/ClassHelper');
const MessageSource = require('./MessageSource');
const JsMessageSource = require('./JsMessageSource');
const MessageFormatter = require('./MessageFormatter');
const Message = require('./Message');