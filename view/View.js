/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class View extends Base {

    constructor (config) {
        super({
            // parent: new View
            // origin: new View
            theme: config.parent && config.parent.theme, // theme name
            ThemeSet: require('./ThemeSet'),
            ...config
        });
    }

    async init () {
        if (this.origin) {
            this.origin.createThemeMap();
            this.parent = this.origin.isEmpty() ? this.parent : this.origin;
        }
        this.createThemeMap();
    }
    
    createThemeMap () {
        this.themeSet = ClassHelper.spawn(this.ThemeSet, {
            theme: this.theme,
            parent: this.parent && this.parent.themeSet,
            directory: this.module.getPath(),
            isOrigin: this.parent && this.parent === this.origin
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