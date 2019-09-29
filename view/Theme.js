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
            LocaleFileMap: require('./LocaleFileMap'),
            ...config
        });        
        this.createTemplateMap();
        this.createModelMap();
    }

    createTemplateMap () {
        this._templates = ClassHelper.spawn(this.LocaleFileMap, {
            baseDir: path.join(this.dir, 'template'),
            localeDir: path.join(this.dir, 'locale/template')
        });
    }

    createModelMap () {
        this._models = ClassHelper.spawn(this.LocaleFileMap, {
            baseDir: path.join(this.dir, 'model'),
            localeDir: path.join(this.dir, 'locale/model'),
            required: true
        });
    }

    init () {
    }

    isEmpty () {
        return this._templates.isEmpty();
    }

    // TEMPLATE

    getTemplate (name, language) {
        return this._templates.get(...arguments)
            || this.parent && this.parent.getTemplate(...arguments)
            || name;
    }

    getOwnTemplate () {
        return this._templates.get(...arguments);
    }

    getOwnTemplateWithOrigin () {
        return this._templates.get(...arguments)
            || this.isOrigin && this.parent && this.parent.getOwnTemplate(...arguments);
    }

    getParentTemplate () {
        return this.parent && this.parent.getTemplate(...arguments);
    }

    getViewOwnTemplate () {
        return this._templates.get(...arguments)
            || this.parent && this.parent.view === this.view && this.parent.getViewOwnTemplate(...arguments);
    }

    getViewOwnTemplateWithOrigin () {
        return this._templates.get(...arguments) || this.parent
            && (this.isOrigin || this.parent.view === this.view) && this.parent.getViewOwnTemplate(...arguments);
    }

    getClosestAncestorTemplate () {
        let ancestor = this, current, closest;
        while (ancestor) {
            if (current) {
                closest = ancestor.getOwnTemplate(...arguments);
                if (closest && current !== closest) {
                    return closest;
                }
            } else {
                current = ancestor.getOwnTemplate(...arguments);
            }
            ancestor = ancestor.parent;
        }
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