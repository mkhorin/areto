/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class View extends Base {

    constructor (config) {
        super({
            // parent: new View
            // original: new View
            theme: config.parent && config.parent.theme, // theme name
            ThemeSet: require('./ThemeSet'),
            ...config
        });
    }

    async init () {
        if (this.original) {
            this.original.createThemeMap();
            this.parent = this.original.isEmpty() ? this.parent : this.original;
        }
        this.createThemeMap();
    }
    
    createThemeMap () {
        this.themeSet = ClassHelper.spawn(this.ThemeSet, {
            theme: this.theme,
            parent: this.parent && this.parent.themeSet,
            directory: this.module.getPath(),
            isOrigin: this.parent && this.parent === this.original
        });
    }

    getTheme (name) {
        return this.themeSet.get(name);
    }
    
    isEmpty () {
        return this.themeSet.isEmpty();
    }
};

const ClassHelper = require('../helper/ClassHelper');