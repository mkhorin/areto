/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Validator');

module.exports = class RegexValidator extends Base {

    static getConstants () {
        return {
            PATTERNS: {
                'HH:mm': /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
                'HH:mm:ss': /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/,
                'duration': /^[0-9]|P(?!$)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?$/, // seconds or ISO_8601#Duration
                'reservedFilenameChars': /[<>:"\/\\|?*\x00-\x1F]/g,
                'reservedWindowsFilename': /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i
            }
        };
    }

    /**
     * @param {Object} config
     * @param {Object|string} config.pattern - Regex pattern
     * @param {boolean} config.not - Not match pattern (invert result)
     */
    constructor (config) {
        super({
            pattern: null,
            not: false,
            ...config
        });
        this.resolvePattern();
    }

    resolvePattern () {
        if (!this.pattern) {
            throw new Error('Pattern not set');
        }
        if (typeof this.pattern === 'string') {
            if (!Object.prototype.hasOwnProperty.call(this.PATTERNS, this.pattern)) {
                throw new Error(`Built-in pattern not found: ${this.pattern}`);
            }
            this.pattern = this.PATTERNS[this.pattern];
        } else if (!(this.pattern instanceof RegExp)) {
            throw new Error(`Invalid pattern: ${this.pattern}`);
        }
    }

    getMessage () {
        return this.createMessage(this.message, 'Invalid value');
    }

    validateValue (value) {
        if (typeof value !== 'string') {
            return this.getMessage();
        }
        if (this.pattern.test(value) ? this.not : !this.not) {
            return this.getMessage();
        }
    }
};
module.exports.init();