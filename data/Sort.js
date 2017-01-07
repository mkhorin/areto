'use strict';

const Base = require('../base/Base');
const InflectorHelper = require('../helpers/InflectorHelper');

module.exports = class Sort extends Base {

    static getConstants () {
        return {
            ASC: 'ASC',
            DESC: 'DESC'
        };
    }

    constructor (config) {
        super(Object.assign({
            attributes: {},
            enableMultiSort: false,
            sortParam: 'sort',
            separator: ',',
            // defaultOrder
            // route
            // params: 'attrName1,-attrName2'
        }, config));
    }

    init () {        
        for (let name of Object.keys(this.attributes)) {
            let attr = this.attributes[name];
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
            this.attributes[name] = attr;
        }
    }

    hasAttribute (name) {
        return Object.prototype.hasOwnProperty.call(this.attributes, name);
    }

    getOrders (recalc) {
        if (!this._attrOrders || recalc) {
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
                    if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
                        this._attrOrders[attr] = desc ? this.DESC : this.ASC;
                        if (!this.enableMultiSort) {
                            return this._attrOrders;
                        }
                    }
                }
            }
            if (this.defaultOrder && Object.keys(this._attrOrders).length === 0) {
                this._attrOrders = this.defaultOrder;
            }
        }
        return this._attrOrders;
    }

    getOrder (attr) {
        let orders = this.getOrders();
        return Object.prototype.hasOwnProperty.call(orders, attr) ? orders[attr] : null;
    }

    getLink (attr, options = {}) {
        let direction = this.getOrder(attr);
        if (direction) {
            let css = direction === this.DESC ? 'desc' : 'asc';
            options.class = options.class ? `${options.class} ${css}` : css;
        }
        let url = this.createUrl(attr);
        options['data-sort'] = this.createSortParam(attr);
        let label = options.label;
        if (label) {
            delete options.label;
        } else if (this.attributes[attr].label) {
            label = this.attributes[attr].label;
        } else {
            label = InflectorHelper.camelToWords(attr);
        }
        return {label, url, options}; // Html:a()
    }

    createUrl (attr) {
        let params = this.params ? this.params : Object.assign({}, this.controller.getQueryParams());
        params[this.sortParam] = this.createSortParam(attr);
        let route = this.route ? this.route : this.controller.getCurrentRoute();
        return this.controller.createUrl([route, params]);
    }

    createSortParam (attr) {
        let def = this.attributes[attr];
        let directions = Object.assign({}, this.getOrders()), direction;
        if (Object.prototype.hasOwnProperty.call(directions, attr)) {
            direction = directions[attr] === this.DESC ? this.ASC : this.DESC;
            delete directions[attr];
        } else {
            direction = 'default' in def ? def['default'] : this.ASC;
        }
        directions = this.enableMultiSort
            ? Object.assign({[attr]: direction}, directions)
            : {[attr]: direction};
        let sorts = [];
        for (let attr in directions) {
            sorts.push(directions[attr] === this.DESC ? `-${attr}` : attr);
        }
        return sorts.join(this.separator);
    }    
};

module.exports.init();