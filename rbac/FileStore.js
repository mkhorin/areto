'use strict';

const Base = require('./Store');
const path = require('path');

module.exports = class FileStore extends Base {

    constructor (config) {
        super(Object.assign({            
            basePath: config.manager.module.getPath('rbac')
        }, config));
    }
    
    load (cb) {        
        cb(null, {
            items: this.getItems(),
            rules: this.getRules(),
            assignments: this.getAssignments()
        });
    }
    
    getItems () {
        try {
            let items = require(path.join(this.basePath, 'items'));
            for (let name of Object.keys(items)) {
                items[name].name = name;
            }
            return items;
        } catch (err) {
            this.manager.module.log('error', 'RBAC: FileStore: getItems', err);
            return {};
        }
    }

    getRules () {
        try {
            return require(path.join(this.basePath, 'rules'));
        } catch (err) {
            this.manager.module.log('error', 'RBAC: FileStore: getRules', err);
            return {};
        }
    }

    getAssignments () {
        try {
            let assignments = require(path.join(this.basePath, 'assignments'));
            for (let id of Object.keys(assignments)) {
                let items = assignments[id] instanceof Array ? assignments[id] : [assignments[id]];
                assignments[id] = {id, items};
            }
            return assignments;
        } catch (err) {
            this.manager.module.log('error', 'RBAC: FileStore: getAssignments', err);
            return {};
        }
    }
};