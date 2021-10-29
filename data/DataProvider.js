/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class DataProvider extends Base {

    /**
     * @param {Object} config
     * @param {Object} config.controller - Controller instance
     * @param {Object[]} config.allModels
     * @param {number} config.totalCount
     * @param {string} config.id
     */
    constructor (config) {
        super({
            pagination: {},
            sort: null,
            ...config
        });
    }

    async prepare () {
        this.totalCount = await this.prepareTotalCount();
        this.pagination = this.createPagination(this.pagination);
        this.sort = this.createSort(this.sort);
        this.models = await this.prepareModels();
    }

    createPagination (config) {
        if (!config) {
            return null;
        }
        const defaults = {
            Class: require('./Pagination'),
            controller: this.controller,
            totalCount: this.totalCount
        };
        if (this.id) {
            defaults.pageParam = `${this.id}-page`;
            defaults.pageSizeParam = `${this.id}-pageSize`;
        }
        return ClassHelper.spawn(Object.assign(defaults, config));
    }

    createSort (config) {
        if (!config) {
            return null;
        }
        const defaults = {
            Class: require('./Sort'),
            controller: this.controller
        };
        if (this.id) {
            defaults.sortParam = `${this.id}-sort`;
        }
        return ClassHelper.spawn(Object.assign(defaults, config));
    }

    prepareModels () {
        throw new Error('Need to override');
    }

    prepareTotalCount () {
        throw new Error('Need to override');
    }
};

const ClassHelper = require('../helper/ClassHelper');