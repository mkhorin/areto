'use strict';

const Base = require('../base/Base');
const helper = require('../helpers/MainHelper');
const path = require('path');

module.exports = class I18n extends Base {

    static getConstants () {
        return {
            ASTERISK: '*',
            CORE_CATEGORY: 'core',
            APP_CATEGORY: 'app'
        };
    }

    constructor (config) {
        super(Object.assign({
            language: 'en', // active laguage
            sourceLanguage: 'en',
            MessageFormatter: MessageFormatter,
            sources: {},
            basePath: config.module.getPath('messages')
        }, config));
    }

    init () {        
        if (this.parent instanceof I18n) {
            this.sources = Object.assign({}, this.parent.sources, this.sources);
        }
        for (let key of Object.keys(this.sources)) {
            this.sources[key] = helper.createInstance(Object.assign({
                i18n: this,
            }, this.sources[key]));
        }
        if (!(this.CORE_CATEGORY in this.sources) && !((this.CORE_CATEGORY + this.ASTERISK) in this.sources)) {
            this.sources[this.CORE_CATEGORY] = new JsMessageSource({
                i18n: this,
                basePath: path.join(__dirname, 'messages')
            });
        }
        if (!(this.APP_CATEGORY in this.sources) && !((this.APP_CATEGORY + this.ASTERISK) in this.sources)) {
            this.sources[this.APP_CATEGORY] = new JsMessageSource({
                i18n: this
            });
        }
        this.messageFormatter = new this.MessageFormatter;
    }

    translate (category, message, params, language) {
        let source = this.getMessageSource(category);
        let result = source.translate(category, message, language);
        return result === null
            ? this.format(message, params, source.sourceLanguage)
            : this.format(result, params, language);
    }

    format (message, params, language) {
        return params ? this.messageFormatter.format(message, params, language) : message;
    }

    getMessageSource (category) {
        let sources = this.sources;
        if (category in sources) {
            if (!(sources[category] instanceof MessageSource)) {
                sources[category] = helper.createInstance(sources[category]);
            }
            return sources[category];
        } else {
            for (let key in sources) {
                let pos = key.indexOf(this.ASTERISK);
                if (pos > 0 && key.substring(0, pos).indexOf(category) === 0) {
                    if (!(sources[key] instanceof MessageSource)) {
                        sources[key] = helper.createInstance(sources[key]);
                        sources[category] = sources[key];
                    }
                    return sources[key];
                }
            }
            if (this.ASTERISK in sources) {
                if (!(sources[this.ASTERISK] instanceof MessageSource)) {
                    sources[this.ASTERISK] = helper.createInstance(sources[this.ASTERISK]);
                }
                return sources[this.ASTERISK];
            }
        }
        this.module.log('error', `I18n: Unable to locate message source for ${category}`);
        return null;
    }
};
module.exports.init();

const MessageSource = require('./MessageSource');
const JsMessageSource = require('./JsMessageSource');
const MessageFormatter = require('./MessageFormatter');