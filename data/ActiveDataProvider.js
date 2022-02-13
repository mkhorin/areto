/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./DataProvider');

module.exports = class ActiveDataProvider extends Base {

    async prepare () {
        await super.prepare();
        this.prepareSort();
    }

    prepareTotalCount () {
        return this.query.count();
    }

    prepareModels () {
        if (this.pagination) {
            this.pagination.totalCount = this.totalCount;
            if (this.pagination.pageSize > 0) {
                this.query.limit(this.pagination.getLimit()).offset(this.pagination.getOffset());
            }
        }
        if (this.sort) {
            this.query.addOrder(this.sort.getOrders());
        }
        return this.query.all();
    }

    prepareSort () {
        if (this.sort) {
            const model = this.query.model;
            const names = Object.keys(this.sort.attrs);
            names.length
                ? this.setSortByNames(names, model)
                : this.setSortByAttrNames(model);
        }
    }

    setSortByNames (names, model) {
        for (const name of names) {
            if (!this.sort.attrs[name].label) {
                this.sort.attrs[name].label = model.getAttrLabel(name);
            }
        }
    }

    setSortByAttrNames (model) {
        for (const name of model.ATTRS) {
            this.sort.attrs[name] = {
                asc: {[name]: this.sort.ASC},
                desc: {[name]: this.sort.DESC},
                label: model.getAttrLabel(name)
            };
        }
    }
};