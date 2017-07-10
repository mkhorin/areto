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

    setPagination (config) {
        if (config !== null) {
            if (!config.Class) {
                config.Class = require('./Pagination');
            }
            if (this.id) {
                if (!config.pageParam) {
                    config.pageParam = `${this.id}-page`;
                }
                if (!config.pageSizeParam) {
                    config.pageSizeParam = `${this.id}-page-size`;
                }
            }
            config.controller = this.controller;
            config = MainHelper.createInstance(config);
        }
        this.pagination = config;
    }

    setSort (config) {
        if (config !== null) {           
            if (!config.Class) {
                config.Class = require('./Sort');
            }
            if (this.id && !config.sortParam) {
                config.sortParam = `${this.id}-sort`;
            }
            config.controller = this.controller;            
            config = MainHelper.createInstance(config);
        }
        this.sort = config;
    }
   
    prepare (cb) {
        this.prepareTotalCount((err, total)=> {
            this.totalCount = total;
            if (this.pagination) {
                this.pagination.totalCount = total;
            }
            this.setPagination(this.pagination);
            this.setSort(this.sort);
            err ? cb(err) : this.prepareModels((err, models)=> {
                this.models = models;
                cb(err);
            });
        });
    }
};

const MainHelper = require('../helpers/MainHelper');