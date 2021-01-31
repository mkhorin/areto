/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Theme extends Base {

    constructor (config) {
        super({
            // name: theme name
            // directory: theme directory
            // parent: Theme
            // themeSet: ThemeSet
            LocaleFileMap: require('./LocaleFileMap'),
            ...config
        });
        this.view = this.themeSet.view;
        this.sameParentView = this.parent?.view === this.view;
        this.createTemplateMap();
        this.createModelMap();
    }

    init () {
    }

    isEmpty () {
        return this._templates.isEmpty();
    }

    createTemplateMap () {
        this._templates = this.createFileMap({
            directory: 'template'
        });
    }

    createModelMap () {
        this._models = this.createFileMap({
            directory: 'model',
            required: true
        });
    }

    createFileMap (config) {
        return ClassHelper.spawn(this.LocaleFileMap, {
            baseDirectory: this.directory,
            ...config
        });
    }

    // TEMPLATE

    getTemplate (name) {
        return this._templates.get(...arguments) || this.parent?.getTemplate(...arguments);
    }

    getOwnTemplate () {
        return this._templates.get(...arguments);
    }

    getOwnTemplateWithOrigin () {
        return this._templates.get(...arguments)
            || this.baseParentView
            && this.parent?.getOwnTemplate(...arguments);
    }

    getParentTemplate () {
        return this.parent?.getTemplate(...arguments);
    }

    getViewOwnTemplate () {
        return this._templates.get(...arguments)
            || this.sameParentView && this.parent.getViewOwnTemplate(...arguments);
    }

    getViewOwnTemplateWithOrigin () {
        return this._templates.get(...arguments)
            || this.parent
                && (this.baseParentView || this.sameParentView)
                && this.parent.getViewOwnTemplate(...arguments);
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
        return this.parent?.getModel(name, language);
    }

    getViewOwnModel (name, language) {
        return this._models.get(name, language)
            || this.sameParentView && this.parent.getViewOwnModel(name, language);
    }

    getViewOwnModelWithOrigin () {
        return this._models.get(...arguments)
            || this.parent
                && (this.baseParentView || this.sameParentView)
                && this.parent.getViewOwnModel(...arguments);
    }
};

const ClassHelper = require('../helper/ClassHelper');