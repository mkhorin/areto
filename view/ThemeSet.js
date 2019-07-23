/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class ThemeSet extends Base {

    constructor (config) {
        super({
            // dir: [base dir]
            // parent: [ThemeMap]
            // theme: [theme name]
            defaultThemeDir: 'view',
            themeDir: 'theme',
            modulePriority: false,
            Theme: require('./Theme'),
            ...config
        });
        this.defaultThemeDir = path.join(this.dir, this.defaultThemeDir);
        this.themeDir = path.join(this.dir, this.themeDir);
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
        this._defaultTheme = ClassHelper.spawn(this.Theme, {
            name: null,
            dir: this.defaultThemeDir,
            parent: this.parent ? this.parent.get() : null,
            view: this,
            isOrigin: this.isOrigin
        });
    }

    createThemes () {
        this._themes = {};
        try {
            for (let name of fs.readdirSync(this.themeDir)) {
                let dir = path.join(this.themeDir, name);
                if (fs.lstatSync(dir).isDirectory()) {
                    this.createTheme(name, dir);
                }
            }
        } catch (err) {}
    }

    createTheme (name, dir) {
        this._themes[name] = ClassHelper.spawn(this.Theme, {view: this, name, dir});
    }

    setParents () {
        for (let name of Object.keys(this._themes)) {
            this._themes[name].parent = this.getParentByName(name) || this._defaultTheme;
        }
    }

    getParentByName (name) {
        let pos = name.lastIndexOf('.');
        if (pos > 0) {
            let parentName = name.substring(0, pos);
            if (this.has(parentName)) {
                return this._themes[parentName];
            }
        } else if (this.parent && !this.modulePriority) {
            return this.parent.get(name);
        }
    }

    init () {
        this._defaultTheme.init();
        for (let theme of Object.values(this._themes)) {
            theme.init();
        }
    }

    isEmpty () {
        if (!this._defaultTheme.isEmpty()) {
            return false;
        }
        for (let theme of Object.values(this._themes)) {
            if (!theme.isEmpty()) {
                return false;
            }
        }
        return true;
    }
};

const fs = require('fs');
const path = require('path');
const ClassHelper = require('../helper/ClassHelper');