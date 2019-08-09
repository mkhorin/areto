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
    
    async load () {
        return {
            items: this.getItems(),
            rules: this.getRules(),
            assignments: this.getAssignments()
        };
    }
    
    getItems () {
        try {
            const items = this.require('items');
            for (let name of Object.keys(items)) {
                items[name].name = name;
            }
            return items;
        } catch (err) {
            this.log('error', 'getItems', err);
            return {};
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
            for (let id of Object.keys(assignments)) {
                let items = Array.isArray(assignments[id]) ? assignments[id] : [assignments[id]];
                assignments[id] = {id, items};
            }
            return assignments;
        } catch (err) {
            this.log('error', 'getAssignments', err);
            return {};
        }
    }

    require (target) {
        return require(path.join(this.basePath, target));
    }
};

const path = require('path');