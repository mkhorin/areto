/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Store');

module.exports = class FileStore extends Base {

    constructor (config) {
        super({
            basePath: config.rbac.module.getPath('rbac'),
            ...config
        });
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
            let items = require(path.join(this.basePath, 'items'));
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
            return require(path.join(this.basePath, 'rules'));
        } catch (err) {
            this.log('error', 'getRules', err);
            return {};
        }
    }

    getAssignments () {
        try {
            let assignments = require(path.join(this.basePath, 'assignments'));
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
};

const path = require('path');