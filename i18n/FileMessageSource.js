/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./MessageSource');

module.exports = class FileMessageSource extends Base {

    constructor (config) {
        super({
            basePath: 'message',
            ...config
        });
        this.basePath = this.module.resolvePath(this.basePath);
    }

    async load () {
        this._messages = {};
        const stat = await FileHelper.getStat(this.basePath);
        if (stat && stat.isDirectory()) {
            await FileHelper.handleChildDirectories(this.basePath, this.loadLanguage.bind(this));
        }
    }

    async loadLanguage (file, dir) {
        const language = FileHelper.getBasename(file);
        await FileHelper.handleChildFiles(path.join(dir, file), (file, dir) => {
            const key = `${language}/${FileHelper.getBasename(file)}`;
            this._messages[key] = require(path.join(dir, file));
        });
    }
};

const path = require('path');
const FileHelper = require('areto/helper/FileHelper');
