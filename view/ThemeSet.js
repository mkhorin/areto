/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class ThemeSet extends Base {

    constructor (config) {
        super({
            // directory: [base directory]
            // parent: [ThemeMap]
            // theme: [theme name]
            defaultThemeDirectory: 'view',
            themeDirectory: 'theme',
            modulePriority: false,
            Theme: require('./Theme'),
            ...config
        });
        this.defaultThemeDirectory = path.join(this.directory, this.defaultThemeDirectory);
        this.themeDirectory = path.join(this.directory, this.themeDirectory);
        this.createDefault();
        this.createThemes();
        this.setParents();
        this.init();
    }

    has (name) {
        return this._themes[name] instanceof this.Theme;
    }

    get (name) {
        name = name || this.theme;
        if (!name) {
            return this._defaultTheme;
        }
        if (this.has(name)) {
            return this._themes[name];
        }
        if (this.parent) {
            return this.parent.get(name);
        }
        return this._defaultTheme;
    }

    createDefault () {
        this._defaultTheme = this.spawn(this.Theme, {
            name: null,
            directory: this.defaultThemeDirectory,
            parent: this.parent ? this.parent.get() : null,
            view: this,
            originalParentView: this.originalParentView
        });
    }

    createThemes () {
        this._themes = {};
        try {
            for (const name of fs.readdirSync(this.themeDirectory)) {
                const dir = path.join(this.themeDirectory, name);
                if (fs.lstatSync(dir).isDirectory()) {
                    this.createTheme(name, dir);
                }
            }
        } catch {}
    }

    createTheme (name, directory) {
        this._themes[name] = this.spawn(this.Theme, {view: this, name, directory});
    }

    setParents () {
        for (const name of Object.keys(this._themes)) {
            this._themes[name].parent = this.getParentByName(name) || this._defaultTheme;
        }
    }

    getParentByName (name) {
        const pos = name.lastIndexOf('.');
        if (pos > 0) {
            const parentName = name.substring(0, pos);
            if (this.has(parentName)) {
                return this._themes[parentName];
            }
        } else if (this.parent && !this.modulePriority) {
            return this.parent.get(name);
        }
    }

    init () {
        this._defaultTheme.init();
        for (const theme of Object.values(this._themes)) {
            theme.init();
        }
    }

    isEmpty () {
        if (!this._defaultTheme.isEmpty()) {
            return false;
        }
        for (const theme of Object.values(this._themes)) {
            if (!theme.isEmpty()) {
                return false;
            }
        }
        return true;
    }
};

const fs = require('fs');
const path = require('path');