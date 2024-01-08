/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
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

    /**
     * @param {Object} config
     * @param {number} config.totalCount
     * @param {string} config.route
     * @param {Object} config.params
     */
    constructor (config) {
        super({
            pageParam: 'page',
            pageSizeParam: 'pageSize',
            defaultPageSize: 10,
            pageSizeLimit: [1, 50],
            forcePageParam: true,
            validatePage: true,
            pageSize: null,
            page: null,
            ...config
        });
        if (!this.route) {
            this.route = this.controller.getCurrentRoute();
        }
        if (this.pageSize === null) {
            this.pageSize = this.getQueryParam(this.pageSizeParam, this.defaultPageSize);
        }
        this.setPageSize(this.pageSize);
        if (this.page === null) {
            const page = this.getQueryParam(this.pageParam, 1);
            this.page = parseInt(page) - 1;
        }
        this.setPage(this.page);
    }

    setPageSize (value) {
        if (value === null) {
            return this.pageSize = null;
        }
        const limit = this.pageSizeLimit;
        value = parseInt(value);
        if (limit?.length === 2) {
            if (value < limit[0]) {
                value = limit[0];
            } else if (value > limit[1]) {
                value = limit[1];
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
            const pageCount = this.getPageCount();
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
        const total = this.totalCount < 0 ? 0 : this.totalCount;
        return Math.floor((total + this.pageSize - 1) / this.pageSize);
    }

    getOffset () {
        return this.pageSize < 1 ? 0 : this.page * this.pageSize;
    }

    getLimit () {
        return this.pageSize < 1 ? -1 : this.pageSize;
    }

    getLinks () {
        const {page} = this;
        const pageCount = this.getPageCount();
        const links = {
            [this.LINK_SELF]: this.createUrl(page)
        };
        if (page > 0) {
            links[this.LINK_PREV] = this.createUrl(page - 1);
        }
        if (page > 1) {
            links[this.LINK_FIRST] = this.createUrl(0);
        }
        if (page < pageCount - 1) {
            links[this.LINK_NEXT] = this.createUrl(page + 1);
        }
        if (page < pageCount - 2) {
            links[this.LINK_LAST] = this.createUrl(pageCount - 1);
        }
        return links;
    }

    getQueryParam (name, defaultValue) {
        const params = this.params || this.controller.getQueryParams();
        const value = params[name] ? parseInt(params[name]) : NaN;
        return Number.isNaN(value) ? defaultValue : value;
    }

    createUrl (page, pageSize) {
        const params = this.params || {...this.controller.getQueryParams()};
        if (page > 0 || page >= 0 && this.forcePageParam) {
            params[this.pageParam] = page + 1;
        } else {
            delete params[this.pageParam];
        }
        if (!pageSize) {
            pageSize = this.pageSize;
        }
        if (pageSize !== this.defaultPageSize) {
            params[this.pageSizeParam] = pageSize;
        } else {
            delete params[this.pageSizeParam];
        }
        return this.controller.createUrl([this.route, params]);
    }
};
module.exports.init();