/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';
/**
 * Line and block comments excluding quoted strings and regex
 *
 * Keeps: ((["'`])(?:\\[\s\S]|.)*?\2|\/(?![*\/])(?:\\.|\[(?:\\.|.)\]|.)*?\/)
 * Quoted strings: (["'`])(?:\\[\s\S]|.)*?\2
 * Regex literals: \/(?![*\/])(?:\\.|\[(?:\\.|.)\]|.)*?\/
 * Line comments: \/\/.*?$
 * Block comments: \/\*[\s\S]*?\*\/
 */
const COMMENTS = /((["'`])(?:\\[\s\S]|[\s\S])*?\2|\/(?![*\/])(?:\\.|\[(?:\\.|.)\]|.)*?\/)|\/\/.*?$|\/\*[\s\S]*?\*\//gm;
const LINE_BREAKS = /[\r\n]+/g;
const MULTIPLE_SPACES = /\s\s+/g;

const Base = require('../../base/Base');

module.exports = class Minifier extends Base {

    static removeComments (text) {
        return text.replace(COMMENTS, '$1');
    }

    static removeLineBreaks (text) {
        return text.replace(LINE_BREAKS, ' ');
    }

    static removeMultipleSpaces (text) {
        return text.replace(MULTIPLE_SPACES, ' ');
    }

    execute (text) {
        text = this.constructor.removeComments(text);
        text = this.constructor.removeLineBreaks(text);
        text = this.constructor.removeMultipleSpaces(text);
        return text;
    }
};