'use strict';

const Base = require('./Base');
const fs = require('fs');
const path = require('path');

module.exports = class Template extends Base {

    constructor (config) {
        super(Object.assign({
            themeDir: 'themes',
            viewDir: 'views'
        }, config));
    }

    init () {
        this.baseDir = this.module.getPath();
        this.viewDir = path.join(this.baseDir, this.viewDir);
        this.themeDir = path.join(this.baseDir, this.themeDir);
        this.initThemes();
    }

    initThemes () {
        let Theme = require('./Theme');
        this.defaultTheme = new Theme({
            name: null,
            baseDir: this.viewDir,
            manager: this
        });
        this.themes = {};
        fs.readdir(this.themeDir, (err, files)=> {
            if (!err) {
                for (let themeName of files)  {
                    let dir = path.join(this.themeDir, themeName);
                    if (fs.lstatSync(dir).isDirectory()) {
                        this.themes[themeName] = new Theme({
                            name: themeName,
                            baseDir: dir,
                            manager: this
                        });
                    }
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
        return Object.prototype.hasOwnProperty.call(this.themes, name) ? this.themes[name] : this.defaultTheme;
    }
};