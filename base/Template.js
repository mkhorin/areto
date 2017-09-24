'use strict';

const Base = require('./Base');

module.exports = class Template extends Base {

    constructor (config) {
        super(Object.assign({
            themeDir: 'themes',
            viewDir: 'views',
            Theme: require('./Theme')
        }, config));
    }

    init () {
        super.init();
        this.baseDir = this.module.getPath();
        this.viewDir = path.join(this.baseDir, this.viewDir);
        this.themeDir = path.join(this.baseDir, this.themeDir);
        this.initThemes();
    }

    initThemes () {
        this.defaultTheme = new this.Theme({
            manager: this,
            name: null,
            baseDir: this.viewDir
        });
        this.themes = {};
        fs.readdir(this.themeDir, (err, files)=> {
            if (err) {
                return this.setThemeParents();
            }
            for (let themeName of files)  {
                let dir = path.join(this.themeDir, themeName);
                if (fs.lstatSync(dir).isDirectory()) {
                    this.themes[themeName] = new this.Theme({
                        manager: this,
                        name: themeName,
                        baseDir: dir
                    });
                }
            }
            this.setThemeParents();
        });
    }

    setThemeParents () {
        for (let name in this.themes) {
            let parent = this.defaultTheme;
            let pos = name.lastIndexOf('.');
            if (pos > 0) {
                let parentName = name.substring(0, pos);
                if (Object.prototype.hasOwnProperty.call(this.themes, parentName)) {
                    parent = this.themes[parentName];
                }
            }
            this.themes[name].parent = parent;
        }
    }

    getTheme (name) {        
        name = name || this.theme;
        return Object.prototype.hasOwnProperty.call(this.themes, name)
            ? this.themes[name] : this.defaultTheme;
    }
};

const fs = require('fs');
const path = require('path');