/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./RbacStore');

module.exports = class FileRbacStore extends Base {

    constructor (config) {
        super({
            basePath: 'rbac',
            ...config
        });
        this.basePath = this.module.resolvePath(this.basePath);
    }

    load () {
        return {
            items: this.getItems(),
            rules: this.getRules(),
            assignments: this.getAssignments()
        };
    }

    getItems () {
        try {
            const items = this.require('items');
            for (const name of Object.keys(items)) {
                this.prepareItem(name, items[name]);
            }
            return items;
        } catch (err) {
            this.log('error', 'getItems', err);
            return {};
        }
    }

    prepareItem (name, data) {
        data.name = name;
        this.normalizeArray('children', data);
        this.normalizeArray('parents', data);
        this.normalizeArray('rules', data);
    }

    normalizeArray (key, data) {
        if (data[key] && !Array.isArray(data[key])) {
            data[key] = [data[key]];
        }
    }

    getRules () {
        try {
            return this.require('rules');
        } catch (err) {
            this.log('error', 'getRules', err);
            return {};
        }
    }

    getAssignments () {
        try {
            const assignments = this.require('assignments');
            for (const id of Object.keys(assignments)) {
                this.prepareAssignments(id, assignments);
            }
            return assignments;
        } catch (err) {
            this.log('error', 'getAssignments', err);
            return {};
        }
    }

    prepareAssignments (id, data) {
        const items = Array.isArray(data[id]) ? data[id] : [data[id]];
        data[id] = {id, items};
    }

    require (target) {
        return require(path.join(this.basePath, target));
    }
};

const path = require('path');