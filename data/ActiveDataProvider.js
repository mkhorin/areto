'use strict';

const Base = require('./DataProvider');

module.exports = class ActiveDataProvider extends Base {

    prepareTotalCount (cb) {
        this.query.count(cb);
    }
    
    prepareModels (cb) {
        if (this.pagination) {
            this.pagination.totalCount = this.totalCount;
            if (this.pagination.pageSize > 0) {
                this.query.limit(this.pagination.getLimit()).offset(this.pagination.getOffset());
            }
        }
        if (this.sort) {
            this.query.addOrderBy(this.sort.getOrders());
        }
        this.query.all(cb);
    }
   
    setSort (data) {
        super.setSort(data);
        if (this.sort) {
            let model = this.query.model;
            let names = Object.keys(this.sort.attributes);
            if (names.length === 0) {
                for (let name of model.getAttributeNames()) {
                    this.sort.attributes[name] = {
                        asc: {[name]: this.sort.ASC},
                        desc: {[name]: this.sort.DESC},
                        label: model.getLabel(name) 
                    };
                }
            } else {
                for (let name of names) 
                    if (!this.sort.attributes[name].label)
                        this.sort.attributes[name].label = model.getLabel(name);
            }                         
        }
    }
};