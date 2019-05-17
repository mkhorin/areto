/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Theme extends Base {

    constructor (config) {
        super({
            // name: [theme name]
            // dir: [theme dir]
            // parent: [new Theme]
            // view: [new View]
            LocalFileMap: require('./LocalFileMap'),
            ...config
        });        
        this.createTemplateMap();
        this.createModelMap();
    }

    createTemplateMap () {
        this._templates = ClassHelper.spawn(this.LocalFileMap, {
            baseDir: path.join(this.dir, 'template'),
            localDir: path.join(this.dir, 'local/template')
        });
    }

    createModelMap () {
        this._models = ClassHelper.spawn(this.LocalFileMap, {
            baseDir: path.join(this.dir, 'model'),
            localDir: path.join(this.dir, 'local/model'),
            required: true
        });
    }

    init () {
    }

    isEmpty () {
        return this._templates.isEmpty() && this._models.isEmpty();
    }

    // TEMPLATE

    getTemplate (name, language) {
        return this._templates.get(name, language)
            || this.parent && this.parent.getTemplate(name, language)
            || name;
    }

    getOwnTemplate (name, language) {
        return this._templates.get(name, language);
    }

    getParentTemplate (name, language) {
        return this.parent && this.parent.getTemplate(name, language);
    }

    getViewOwnTemplate (name, language) {
        return this._templates.get(name, language)
            || this.parent && this.parent.view === this.view && this.parent.getViewOwnTemplate(name, language);
    }

    // MODEL

    getModel (name, language) {
        return this.getOwnModel(name, language) || this.getParentModel(name, language);
    }

    getOwnModel (name, language) {
        return this._models.get(name, language);
    }

    getParentModel (name, language) {
        return this.parent && this.parent.getModel(name, language);
    }

    getViewOwnModel (name, language) {
        return this._models.get(name, language)
            || this.parent && this.parent.view === this.view && this.parent.getViewOwnModel(name, language);
    }
};

const path = require('path');
const ClassHelper = require('../helper/ClassHelper');