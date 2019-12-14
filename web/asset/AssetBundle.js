/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../base/Base');

module.exports = class AssetBundle extends Base {

    // style: ['style/file1.css', ['style/file2.css', {media: 'print'}]]
    // script: ['script/file1.js', ['script/file2.js', {position: _view.POS_HEAD}]]
    // version: '1.2.3' // ?v=1.2.3

    constructor (config) {
        super(config);

        if (this.styles && !Array.isArray(this.styles)) {
            this.styles = [this.styles];
        }
        if (this.scripts && !Array.isArray(this.scripts)) {
            this.scripts = [this.scripts];
        }
        if (this.depends && !Array.isArray(this.depends)) {
            this.depends = [this.depends]; // ['asset name']
        }
        this.styleOptions = this.styleOptions || {}; // {media: 'print'}
        this.scriptOptions = this.scriptOptions || {}; // {position: _view.POS_HEAD}
        this.styleOptions.version = this.styleOptions.version || this.version;
        this.scriptOptions.version = this.scriptOptions.version || this.version;

        if (!this.name) {
            // set name as first item name
            if (this.styles && this.styles.length) {
                this.name = Array.isArray(this.styles[0]) ? this.styles[0][0] : this.styles[0];
            } else if (this.scripts && this.scripts.length) {
                this.name = Array.isArray(this.scripts[0]) ? this.scripts[0][0] : this.scripts[0];
            } else {
                this.name = '';
            }
        }
        this._result = {};
    }

    render (pos) {
        if (!this._result.hasOwnProperty(pos)) {
            this._result[pos] = '';
            if (this.styles && pos === ActionView.POS_HEAD) {
                this._result[pos] += this.renderStyles();
            }
            if (this.scripts) {
                this._result[pos] += this.renderScripts(pos);
            }
        }
        return this._result[pos];
    }

    renderStyles () {
        let result = '';
        for (const item of this.styles) {
            result += Array.isArray(item)
                ? this.renderStyle(item[0], {...this.styleOptions, ...item[1]})
                : this.renderScript(item, this.styleOptions);
        }
        return result;
    }

    renderScripts (pos) {
        let result = '';
        for (let item of this.scripts) {
            let options = this.scriptOptions;
            if (Array.isArray(item)) {
                options = {...this.scriptOptions, ...item[1]};
                item = item[0];
            }
            if (options.position ? (pos === options.position) : (pos === ActionView.POS_BODY_END)) {
                result += this.renderScript(item, options);
            }
        }
        return result;
    }

    renderStyle (source, {media, version}) {
        media = media ? `media="${media}"` : '';
        version = version ? `?v=${version}` : '';
        return `<link href="${source}${version}" ${media} rel="stylesheet">\n`;
    }

    renderScript (source, {version}) {
        version = version ? `?v=${version}` : '';
        return `<script src="${source}${version}"></script>\n`;
    }

    log (type, message) {        
        this.manager.log(type, this.wrapClassMessage(message), util.inspect([this.scripts, this.styles]));
    }
};

const util = require('util');
const ActionView = require('../../view/ActionView');

