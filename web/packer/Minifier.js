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

const Base = require('../../base/Base');

module.exports = class Minifier extends Base {

    execute (text) {
        if (typeof text !== 'string') {
            return String(text);
        }
        // remove comments
        text = text.replace(COMMENTS, '$1');
        // replace new line breaks
        text = text.replace(/[\r\n]+/g, ' ');
        // replace multiple spaces
        text = text.replace(/\s\s+/g, ' ');
        return text;
    }
};