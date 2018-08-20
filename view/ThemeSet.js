'use strict';

const Base = require('../base/Base');

module.exports = class ThemeSet extends Base {

    constructor (config) {
        super(Object.assign({
            // dir: base dir
            // parent: new ThemeMap
            // theme: theme name
            defaultThemeDir: 'view',
            themeDir: 'theme',
            modulePriority: false,
            Theme: require('./Theme')
        }, config));
        
        this.defaultThemeDir = path.join(this.dir, this.defaultThemeDir);
        this.themeDir = path.join(this.dir, this.themeDir);
        
        this.createDefault();
        this.createThemes();
        this.setParents();
        this.configure();
    }

    has (name) {
        return Object.prototype.hasOwnProperty.call(this._themes, name);
    }

    get (name) {
        name = name || this.theme;
        if (name) {
            if (this.has(name)) {
                return this._themes[name];
            }
            if (this.parent) {
                return this.parent.get(name);
            }
        }
        return this._defaultTheme;
    }

    createDefault () {
        this._defaultTheme = ClassHelper.createInstance(this.Theme, {
            'name': null,
            'dir': this.defaultThemeDir,
            'parent': this.parent ? this.parent.get() : null,
            'view': this
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
        this._themes[name] = ClassHelper.createInstance(this.Theme, {
            name,
            dir,
            view: this
        });
    }

    setParents () {
        for (let name of Object.keys(this._themes)) {
            let parent;
            let pos = name.lastIndexOf('.');
            if (pos > 0) {
                let parentName = name.substring(0, pos);
                if (this.has(parentName)) {
                    parent = this._themes[parentName];
                }
            } else if (this.parent && !this.modulePriority) {
                parent = this.parent.get(name);
            }
            this._themes[name].parent = parent || this._defaultTheme;
        }
    }

    configure () {
        this._defaultTheme.configure();
        for (let theme of Object.values(this._themes)) {
            theme.configure();
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