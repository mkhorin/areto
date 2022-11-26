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
                const limit = this.pagination.getLimit();
                const offset = this.pagination.getOffset();
                models = models.slice(offset, offset + limit);
            }
        }
        return models;
    }

    sortModels (models, sort) {
        const orders = sort.getOrders();
        if (orders) {
            const directions = {};
            for (const attr of Object.keys(orders)) {
                directions[attr] = orders[attr] === sort.ASC ? 1 : -1;
            }
            models.sort(this.compareModels.bind(this, orders, directions));
        }
        return models;
    }

    compareModels (orders, directions, a, b) {
        for (const attr of Object.keys(orders)) {
            const result = String(a[attr]).localeCompare(String(b[attr]));
            if (result !== 0) {
                return result * directions[attr];
            }
        }
        return 0;
    }
};