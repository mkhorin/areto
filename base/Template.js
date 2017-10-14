'use strict';

const Base = require('./Base');

module.exports = class Template extends Base {

    constructor (config) {
        super(Object.assign({
            themeDir: 'themes',
            viewDir: 'views',
            Theme: require('./Theme'),
            moduleViewPriority: false
        }, config));
    }

    init () {
        this.viewDir = this.module.getPath(this.viewDir);
        this.themeDir = this.module.getPath(this.themeDir);
    }

    configure (cb) {
        this.initThemes(cb);
    }

    initThemes (cb) {
        this.defaultTheme = new this.Theme({
            template: this,
            name: null,
            baseDir: this.viewDir
        });
        this.themes = {};
        fs.readdir(this.themeDir, (err, files)=> {
            if (err) {
                return cb(); // ignore not exists theme dir
            }
            this.findThemes(files, err => {
                this.setThemeParents();
                cb(err);
            });
        });
    }

    createThemes (files, cb) {
        async.eachSeries(files, (name, cb)=> {
            this.createTheme(name, cb);
        }, cb);
    }

    createTheme (name, cb) {
        let baseDir = path.join(this.themeDir, name);
        async.waterfall([
            cb => fs.stat(baseDir, cb),
            (stat, cb)=> {
                if (stat.isDirectory()) {
                    this.themes[name] = new this.Theme({
                        name,
                        baseDir,
                        template: this
                    });
                }
                cb();
            }
        ], cb);
    }

    setThemeParents () {
        for (let name of Object.keys(this.themes)) {
            let parent, pos = name.lastIndexOf('.');
            if (pos > 0) {
                let parentName = name.substring(0, pos);
                if (this.hasTheme(parentName)) {
                    parent = this.themes[parentName];
                }
            } else if (!this.moduleViewPriority) {
                parent = this.getParentTemplateTheme(name);
            }
            this.themes[name].parent = parent || this.defaultTheme;
        }
    }

    getParentTemplateTheme (name) {
        return !this.parent ? null : this.parent.hasTheme(name)
            ? this.parent.themes[name] : this.parent.getParentTemplateTheme(name);
    }

    hasTheme (name) {
        return Object.prototype.hasOwnProperty.call(this.themes, name);
    }

    getTheme (name) {        
        name = name || this.theme;
        return this.hasTheme(name) ? this.themes[name] : this.defaultTheme;
    }
};

const async = require('async');
const fs = require('fs');
const path = require('path');