'use strict';

const Base = require('../base/Base');

module.exports = class DataProvider extends Base {

    constructor (config) {
        super(Object.assign({
            pagination: {},
            sort: null,
            // controller: this,
            // allModels: [],
            // totalCount: 100
            // id: 'id'
        }, config));
    }

    createPagination (config) {
        if (!config) {
            return null;
        }
        let defaults = {
            Class: require('./Pagination'),
            controller: this.controller,
            totalCount: this.totalCount
        };
        if (this.id) {
            defaults.pageParam = `${this.id}-page`;
            defaults.pageSizeParam = `${this.id}-page-size`;
        }
        return ClassHelper.createInstance(Object.assign(defaults, config));
    }

    createSort (config) {
        if (!config) {
            return null;
        }
        let defaults = {
            Class: require('./Sort'),
            controller: this.controller
        };
        if (this.id) {
            defaults.sortParam = `${this.id}-sort`;
        }
        return ClassHelper.createInstance(Object.assign(defaults, config));
    }
   
    prepare (cb) {
        AsyncHelper.waterfall([
            cb => this.prepareTotalCount(cb),
            (total, cb)=> {
                this.totalCount = total;
                this.pagination = this.createPagination(this.pagination);
                this.sort = this.createSort(this.sort);
                this.prepareModels(cb);
            },
            (models, cb)=> {
                this.models = models;
                cb();
            }
        ], cb);
    }
};

const AsyncHelper = require('../helper/AsyncHelper');
const ClassHelper = require('../helper/ClassHelper');