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

    getTemplate () {
        return this._templates.get(...arguments) || this.parent?.getTemplate(...arguments);
    }

    getInternalTemplate () {
        return this._templates.get(...arguments);
    }

    getParentTemplate () {
        return this.parent?.getTemplate(...arguments);
    }

    getTemplateFromOriginal () {
        return this._templates.get(...arguments)
            || this.originalParentView && this.parent?.getTemplateFromOriginal(...arguments);
    }

    /**
     * Get own template or get from parent theme if it belongs to the same view
     */
    getTemplateFromSameView () {
        return this._templates.get(...arguments)
            || this.sameParentView && this.parent?.getTemplateFromSameView(...arguments);
    }

    /**
     * Get own template or get from parent theme if it belongs to the same view or original module view
     */
    getTemplateFromOriginalOrSameView () {
        return this._templates.get(...arguments)
            || (this.originalParentView || this.sameParentView)
                && this.parent?.getTemplateFromOriginalOrSameView(...arguments);
    }

    getClosestAncestorTemplate () {
        let ancestor = this, current, closest;
        while (ancestor) {
            if (current) {
                closest = ancestor.getInternalTemplate(...arguments);
                if (closest && current !== closest) {
                    return closest;
                }
            } else {
                current = ancestor.getInternalTemplate(...arguments);
            }
            ancestor = ancestor.parent;
        }
    }

    // MODEL

    getModel () {
        return this.getInternalModel(...arguments) || this.parent?.getModel(...arguments);
    }

    getInternalModel () {
        return this._models.get(...arguments);
    }

    getParentModel () {
        return this.parent?.getModel(...arguments);
    }

    getModelFromOriginal () {
        return this._models.get(...arguments)
            || this.originalParentView && this.parent?.getModelFromOriginal(...arguments);
    }

    getModelFromSameView () {
        return this._models.get(...arguments)
            || this.sameParentView && this.parent?.getModelFromSameView(...arguments);
    }

    getModelFromOriginalOrSameView () {
        return this._models.get(...arguments)
            || (this.originalParentView || this.sameParentView)
                && this.parent?.getModelFromOriginalOrSameView(...arguments);
    }
};

const ClassHelper = require('../helper/ClassHelper');