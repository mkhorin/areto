/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Pagination extends Base {

    static getConstants () {
        return {
            LINK_SELF: 'self',
            LINK_NEXT: 'next',
            LINK_PREV: 'prev',
            LINK_FIRST: 'first',
            LINK_LAST: 'last'
        };
    }

    constructor (config) {
        super(Object.assign({
            pageParam: 'page',
            pageSizeParam: 'page-size',
            defaultPageSize: 10,
            pageSizeLimit: [1, 50],            
            forcePageParam: true,
            validatePage: true,
            pageSize: null,
            page: null,
            // totalCount: 0,
            // route:
            // params: {}
        }, config));
        
        if (!this.route) {
            this.route = this.controller.getCurrentRoute();
        }
        if (this.pageSize === null) {
            this.pageSize = this.getQueryParam(this.pageSizeParam, this.defaultPageSize);
        }
        this.setPageSize(this.pageSize);
        if (this.page === null) {
            this.page = parseInt(this.getQueryParam(this.pageParam, 1)) - 1;
        }
        this.setPage(this.page);
    }

    setPageSize (value) {
        if (value === null) {
            return this.pageSize = null;
        }
        value = parseInt(value);
        if (this.pageSizeLimit instanceof Array && this.pageSizeLimit.length === 2) {
            if (value < this.pageSizeLimit[0]) {
                value = this.pageSizeLimit[0];
            } else if (value > this.pageSizeLimit[1]) {
                value = this.pageSizeLimit[1];
            }
        }
        this.pageSize = value;
    }

    setPage (value) {
        if (value === null) {
            return this.page = null;
        }
        value = parseInt(value);
        if (this.validatePage) {
            let pageCount = this.getPageCount();
            if (value >= pageCount) {
                value = pageCount - 1;
            }
        }
        this.page = value < 0 ? 0 : value;
    }
    
    getPageCount () {
        if (this.pageSize < 1) {
            return this.totalCount > 0 ? 1 : 0;
        }
        let total = this.totalCount < 0 ? 0 : this.totalCount;
        return Math.floor((total + this.pageSize - 1) / this.pageSize);
    }

    getOffset () {
        return this.pageSize < 1 ? 0 : this.page * this.pageSize;
    }

    getLimit () {        
        return this.pageSize < 1 ? -1 : this.pageSize;
    }

    getLinks () {
        let currentPage = this.page;
        let pageCount = this.getPageCount();
        let links = {
            [this.LINK_SELF]: this.createUrl(currentPage)
        };
        if (currentPage > 0) {
            links[this.LINK_FIRST] = this.createUrl(0);
            links[this.LINK_PREV] = this.createUrl(currentPage - 1);
        }
        if (currentPage < pageCount - 1) {
            links[this.LINK_NEXT] = this.createUrl(currentPage + 1);
            links[this.LINK_LAST] = this.createUrl(pageCount - 1);
        }
        return links;
    }

    getQueryParam (name, defaultValue) {
        let params = this.params ? this.params : this.controller.getQueryParams();
        let value = params[name] ? parseInt(params[name]) : NaN;
        return Number.isNaN(value) ? defaultValue : value;
    }

    createUrl (page, pageSize) {
        let params = this.params ? this.params : Object.assign({}, this.controller.getQueryParams());
        if (page > 0 || page >= 0 && this.forcePageParam) {
            params[this.pageParam] = page + 1;
        } else {
            delete params[this.pageParam];
        }
        pageSize = pageSize || this.pageSize;
        if (pageSize !== this.defaultPageSize) {
            params[this.pageSizeParam] = pageSize;
        } else {
            delete params[this.pageSizeParam];
        }
        return this.controller.createUrl([this.route, params]);
    }
};
module.exports.init();