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

    loadMessages (category, language) {
        const file = path.join(this.basePath, language, category);
        try {
            const data = require(file);
            if (data) {
                return data;
            }
            this.log('warn', `Invalid message data: ${file}`);

        } catch (err) {
            this.log('warn', `Invalid file: ${file}`, err);
        }
        return {};
    }
};

const path = require('path');