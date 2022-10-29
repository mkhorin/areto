/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Sort extends Base {

    static getConstants () {
        return {
            ASC: 1,
            DESC: -1
        };
    }

    /**
     * @param {Object} config
     * @param {Object} config.defaultOrder - Default order: {[attrName]: 1}
     * @param {string} config.route - URL route
     * @param {string} config.params - Additional params: 'attrName1,-attrName2'
     */
    constructor (config) {
        super({
            attrs: {},
            enableMultiSort: false,
            sortParam: 'sort',
            separator: ',',
            ...config
        });
        this.initAttrs();
    }

    initAttrs () {
        for (const name of Object.keys(this.attrs)) {
            let attr = this.attrs[name];
            if (typeof attr !== 'object') {
                attr = {
                    asc: {[name]: this.ASC},
                    desc: {[name]: this.DESC}
                }
            } else {
                if (!attr.asc) {
                    attr.asc = {[name]: this.ASC};
                }
                if (!attr.desc) {
                    attr.desc = {[name]: this.DESC};
                }
            }
            this.attrs[name] = attr;
        }
    }

    hasAttr (name) {
        return Object.prototype.hasOwnProperty.call(this.attrs, name);
    }

    getOrders (recalculate) {
        if (this._attrOrders && !recalculate) {
            return this._attrOrders;
        }
        this._attrOrders = {};
        let attrs = this.params || this.controller.getQueryParam(this.sortParam);
        if (attrs) {
            attrs = attrs.split(this.separator);
            for (let attr of attrs) {
                let desc = false;
                if (attr.charAt(0) === '-') {
                    desc = true;
                    attr = attr.substring(1);
                }
                if (Object.prototype.hasOwnProperty.call(this.attrs, attr)) {
                    this._attrOrders[attr] = desc ? this.DESC : this.ASC;
                    if (!this.enableMultiSort) {
                        return this._attrOrders;
                    }
                }
            }
        }
        if (this.defaultOrder && !Object.values(this._attrOrders).length) {
            this._attrOrders = this.defaultOrder;
        }
        return this._attrOrders;
    }

    getOrder (attr) {
        const orders = this.getOrders();
        return Object.prototype.hasOwnProperty.call(orders, attr)
            ? orders[attr]
            : null;
    }

    getLink (attr, options = {}) {
        const direction = this.getOrder(attr);
        if (direction) {
            const className = direction === this.DESC
                ? 'desc'
                : 'asc';
            options.class = options.class
                ? `${options.class} ${className}`
                : className;
        }
        const url = this.createUrl(attr);
        options['data-sort'] = this.createSortParam(attr);
        let label = options.label;
        if (label) {
            delete options.label;
        } else if (this.attrs[attr].label) {
            label = this.attrs[attr].label;
        } else {
            label = StringHelper.camelToWords(attr);
        }
        return {label, url, options};
    }

    createUrl (attr) {
        const params = this.params || {...this.controller.getQueryParams()};
        params[this.sortParam] = this.createSortParam(attr);
        const route = this.route || this.controller.getCurrentRoute();
        return this.controller.createUrl([route, params]);
    }

    createSortParam (attr) {
        let data = this.attrs[attr];
        let directions = {...this.getOrders()}, direction;
        if (Object.prototype.hasOwnProperty.call(directions, attr)) {
            direction = directions[attr] === this.DESC ? this.ASC : this.DESC;
            delete directions[attr];
        } else {
            direction = 'default' in data ? data.default : this.ASC;
        }
        directions = this.enableMultiSort
            ? {[attr]: direction, ...directions}
            : {[attr]: direction};
        const sorts = [];
        for (const attr in directions) {
            sorts.push(directions[attr] === this.DESC ? `-${attr}` : attr);
        }
        return sorts.join(this.separator);
    }
};
module.exports.init();

const StringHelper = require('../helper/StringHelper');