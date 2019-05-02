/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../base/Base');

module.exports = class AssetBundle extends Base {

    // css: ['css/style1.css', ['css/style2.css', {media: 'print'}]]
    // js: ['js/script1.js', ['js/script2.js', {position: _view.POS_HEAD}]]
    // version: '1.2.3' // ?v=1.2.3

    constructor (config) {
        super(config);

        if (this.css && !Array.isArray(this.css)) {
            this.css = [this.css];
        }
        if (this.js && !Array.isArray(this.js)) {
            this.js = [this.js];
        }
        if (this.depends && !Array.isArray(this.depends)) {
            this.depends = [this.depends]; // ['asset name']
        }
        this.cssOptions = this.cssOptions || {}; // {media: 'print'}
        this.jsOptions = this.jsOptions || {}; // {position: _view.POS_HEAD}
        this.cssOptions.version = this.cssOptions.version || this.version;
        this.jsOptions.version = this.jsOptions.version || this.version;

        if (!this.name) {
            // set name as first item name
            if (this.css && this.css.length) {
                this.name = Array.isArray(this.css[0]) ? this.css[0][0] : this.css[0];
            } else if (this.js && this.js.length) {
                this.name = Array.isArray(this.js[0]) ? this.js[0][0] : this.js[0];
            } else {
                this.name = '';
            }
        }
        this._result = {};
    }

    render (pos) {
        if (!this._result.hasOwnProperty(pos)) {
            this._result[pos] = '';
            if (this.css && pos === ActionView.POS_HEAD) {
                this._result[pos] += this.renderCss();
            }
            if (this.js) {
                this._result[pos] += this.renderJs(pos);
            }
        }
        return this._result[pos];
    }

    renderCss () {
        let result = '';
        for (let item of this.css) {
            result += Array.isArray(item)
                ? this.renderCssItem(item[0], {...this.cssOptions, ...item[1]})
                : this.renderCssItem(item, this.cssOptions);
        }
        return result;
    }

    renderJs (pos) {
        let result = '';
        for (let item of this.js) {
            let options = this.jsOptions;
            if (Array.isArray(item)) {
                options = {...this.jsOptions, ...item[1]};
                item = item[0];
            }
            if (options.position ? (pos === options.position) : (pos === ActionView.POS_BODY_END)) {
                result += this.renderJsItem(item, options);
            }
        }
        return result;
    }

    renderCssItem (src, options) {
        let media = options.media ? `media="${options.media}"` : '';
        let version = options.version ? `?v=${options.version}` : '';
        return `<link href="${src}${version}" ${media} rel="stylesheet">\n`;
    }

    renderJsItem (src, options) {
        let version = options.version ? `?v=${options.version}` : '';
        return `<script src="${src}${version}"></script>\n`;
    }

    log (type, message, data) {
        data = util.inspect([this.js, this.css]);
        CommonHelper.log(type, message, data, this.constructor.name, this.manager);
    }
};

const util = require('util');
const CommonHelper = require('../../helper/CommonHelper');
const ActionView = require('../../view/ActionView');

