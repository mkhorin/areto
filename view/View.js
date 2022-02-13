/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class View extends Base {

    /**
     * @param {Object} config
     * @param {Object} config.parent - View instance of parent module
     * @param {Object} config.original - View instance of original module
     * @param {string} config.theme - Theme name
     */
    constructor (config) {
        super({
            theme: config.parent?.theme,
            ThemeSet: require('./ThemeSet'),
            ...config
        });
    }

    init () {
        if (this.original) {
            this.original.init();
            this.parent = this.original.isEmpty() ? this.parent : this.original;
            this.originalParent = this.parent === this.original ? this.parent : null;
        }
        this.createThemeMap();
    }

    createThemeMap () {
        this.themeSet = ClassHelper.spawn(this.ThemeSet, {
            theme: this.theme,
            parent: this.parent?.themeSet,
            directory: this.module.getPath(),
            originalParentView: this.originalParent,
            view: this
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