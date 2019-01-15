/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./DataProvider');

module.exports = class ArrayDataProvider extends Base {

    prepareTotalCount () {
        return this.allModels ? this.allModels.length : 0;
    }
    
    prepareModels () {
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
        return models;
    }    

    sortModels (models, sort) {
        let Sort = require('./Sort');
        let orders = sort.getOrders();        
        if (orders) {
            let directions = {};
            for (let attr of Object.keys(orders)) {
                directions[attr] = orders[attr] === Sort.ASC ? 1 : -1;
            }
            models.sort(this.compareModels.bind(this, orders, directions));
        }
        return models;
    }

    compareModels (orders, directions, a, b) {
        for (let attr of Object.keys(orders)) {
            let result = a[attr].toString().localeCompare(b[attr].toString());
            if (result !== 0) {
                return result * directions[attr];
            }
        }
        return 0;
    }
};