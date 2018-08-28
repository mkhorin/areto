'use strict';

const Base = require('../base/Component');

module.exports = class View extends Base {

    constructor (config) {
        super(Object.assign({
            // parent: new View
            theme: config.parent && config.parent.theme, // theme name
            ThemeSet: require('./ThemeSet')
        }, config));
    }

    async init () {
        this.createThemeMap();        
    }

    createThemeMap () {
        this.themeSet = ClassHelper.createInstance(this.ThemeSet, {
            theme: this.theme,
            parent: this.parent && this.parent.themeSet,
            dir: this.module.getPath()
        });
    }

    getTheme (name) {
        return this.themeSet.get(name);
    }
};

const ClassHelper = require('../helper/ClassHelper');