/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class I18n extends Base {

    static getConstants () {
        return {
            CORE_SOURCE: 'areto',
            APP_SOURCE: 'app'
        };
    }

    constructor (config) {
        const parent = config.parent;
        super({
            language: parent ? parent.language : 'en',
            sourceLanguage: parent ? parent.sourceLanguage : 'en',
            sources: {},
            MessageFormatter,
            ...config
        });
        this.createSources();
    }

    async init () {
        this.messageFormatter = this.spawn(this.MessageFormatter);
        this.resolveSourceParents();
        await this.loadSources();
    }

    getSource (name) {
        return Object.prototype.hasOwnProperty.call(this.sources, name) ? this.sources[name] : null;
    }

    async loadSources () {
        for (const source of Object.values(this.sources)) {
            await source.load();
        }
    }

    createSources () {
        for (const name of Object.keys(this.sources)) {
            this.sources[name] = this.createSource(name, this.sources[name]);
        }
        if (!this.getSource(this.CORE_SOURCE)) {
            this.sources[this.CORE_SOURCE] = this.createCoreSource();
        }
        if (!this.getSource(this.APP_SOURCE)) {
            this.sources[this.APP_SOURCE] = this.createAppSource();
        }
        if (this.parent instanceof I18n) {
            AssignHelper.assignUndefined(this.sources, this.parent.sources);
        }
    }

    createCoreSource () {
        if (this.parent) {
            return this.parent.sources[this.CORE_SOURCE];
        }
        return this.createSource(this.CORE_SOURCE, {
            basePath: path.join(__dirname, 'message', this.CORE_SOURCE)
        });
    }

    createAppSource () {
        const source = this.createSource(this.APP_SOURCE);
        if (source.parent === undefined && !this.parent) {
            source.setParent(this.sources[this.CORE_SOURCE]);
        }
        return source;
    }

    createSource (name, config) {
        if (config instanceof MessageSource) {
            return config;
        }
        return this.spawn({
            Class: FileMessageSource,
            i18n: this,
            basePath: `message/${name}`,
            ...config
        });
    }

    resolveSourceParents () {
        for (const name of Object.keys(this.sources)) {
            this.sources[name].setParent(this.resolveSourceParent(name));
            if (ObjectHelper.hasCircularLinks(this.sources[name], 'parent')) {
                throw new Error(`Circular source parents: ${name}`);
            }
        }
    }

    resolveSourceParent (name) {
        const parent = this.sources[name].parent;
        if (parent instanceof MessageSource) {
            return parent;
        }
        return parent === undefined
            ? this.getSourceParent(name)
            : this.getSource(parent);
    }

    getSourceParent (name) {
        const parent = this.parent;
        return parent ? (parent.getSource(name) || parent.getSourceParent(name)) : null;
    }

    format () {
        return this.messageFormatter.format(...arguments);
    }

    translate (message, params, sourceName, language = this.language) {
        const source = this.getSource(sourceName);
        if (!source) {
            this.log('error', `Message source not found: ${sourceName}`);
            return message;
        }
        let result;
        if (source.sourceLanguage !== language) {
            result = source.translate(message, language);
            if (result === null) {
                language = source.sourceLanguage;
                if (source.forceTranslation) {
                    result = source.translate(message, language);
                }
            }
        } else if (source.forceTranslation) {
            result = source.translate(message, language);
        } else if (source.forceTranslationParent) {
            result = source.forceTranslationParent.translate(message, language);
        }
        message = result || message;
        return params ? this.format(message, params, language) : message;
    }

    translateMessage (message) {
        if (Array.isArray(message)) {
            return this.translate(...message);
        }
        if (typeof message?.translate === 'function') {
            return message.translate(this);
        }
        return this.translate(...arguments);
    }

    translateMessageMap (data, ...args) {
        data = {...data};
        for (const key of Object.keys(data)) {
            data[key] = this.translateMessage(data[key], ...args);
        }
        return data;
    }
};
module.exports.init();

const path = require('path');
const AssignHelper = require('../helper/AssignHelper');
const ObjectHelper = require('../helper/ObjectHelper');
const MessageSource = require('./MessageSource');
const FileMessageSource = require('./FileMessageSource');
const MessageFormatter = require('./MessageFormatter');