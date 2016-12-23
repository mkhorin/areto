'use strict';

const Base = require('./DataProvider');

module.exports = class ArrayDataProvider extends Base {

    prepareTotalCount (cb) {        
        cb(null, this.allModels ? this.allModels.length : 0);
    }
    
    prepareModels (cb) {
        let models = this.allModels || [];
        if (this.sort) {
            models = this.sortModels(models, this.sort);
        }
        if (this.pagination) {
            this.pagination.totalCount = this.totalCount;
            if (this.pagination.pageSize > 0) {
                let offset = this.pagination.getOffset();
                models = models.slice(offset, offset + this.pagination.getLimit());
            }
        }        
        cb(null, models);
    }    

    sortModels (models, sort) {
        let Sort = require('./Sort');
        let orders = sort.getOrders();        
        if (orders) {
            let directions = {};
            for (let attr in orders) {
                directions[attr] = orders[attr] === Sort.ASC ? 1 : -1;
            }
            models.sort((a, b)=> {                
                for (let attr in orders) {
                    let result = a[attr].toString().localeCompare(b[attr].toString());
                    if (result !== 0) {
                        return result * directions[attr];
                    }
                }
                return 0;
            });
        }
        return models;
    }
};