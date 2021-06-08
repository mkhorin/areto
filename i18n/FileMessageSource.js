/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./MessageSource');

module.exports = class FileMessageSource extends Base {

    async load () {
        this._messages = {};
        return this.loadModuleMessages(this.module);
    }
    
    async loadModuleMessages (module) {
        if (module.original) {
            await this.loadModuleMessages(module.original);
        }
        const dir = module.resolvePath(this.basePath);
        const stat = await FileHelper.getStat(dir);
        if (stat?.isDirectory()) {
            return FileHelper.handleFiles(dir, file => this.loadFile(file, dir));
        }
    }

    loadFile (file, dir) {
        const language = FileHelper.getBasename(file);
        this._messages[language] = {
            ...this._messages[language],
            ...require(path.join(dir, file))
        };
    }
};

const FileHelper = require('areto/helper/FileHelper');
const path = require('path');