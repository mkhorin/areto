'use strict';

const Base = require('./Base');

module.exports = class Template extends Base {

    constructor (config) {
        super(Object.assign({
            themeDir: 'themes',
            viewDir: 'views',
            Theme: require('./Theme'),
            moduleViewPriority: false,
            theme: config.parent && config.parent.theme
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
            baseDir: this.viewDir,
            parent: this.parent ? this.parent.getTheme() : null
        });
        this.themes = {};
        fs.readdir(this.themeDir, (err, files)=> {
            if (err) {
                return cb(); // ignore not exists theme dir
            }
            async.series([
                cb => this.createThemes(files, cb),
                cb => {
                    this.setThemeParents();
                    cb();
                }
            ], cb);
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
            } else if (this.parent && !this.moduleViewPriority) {
                parent = this.parent.getTheme(parentName);
            }
            this.themes[name].parent = parent || this.defaultTheme;
        }
    }

    isEmpty () {
        if (!this.defaultTheme.isEmpty()) {
            return false;
        }
        for (let name of Object.keys(this.themes)) {
            if (!this.themes[name].isEmpty()) {
                return false;
            }
        }
        return true;
    }

    hasTheme (name) {
        return Object.prototype.hasOwnProperty.call(this.themes, name);
    }

    getTheme (name) {
        name = name || this.theme;
        if (name) {
            if (Object.prototype.hasOwnProperty.call(this.themes, name)) {
                return this.themes[name];
            }
            if (this.parent) {
                return this.parent.getTheme(name);
            }
        }
        return this.defaultTheme;
    }
};

const async = require('async');
const fs = require('fs');
const path = require('path');