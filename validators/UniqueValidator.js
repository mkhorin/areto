'use strict';

let Base = require('./Validator');
let helper = require('../helpers/main');

module.exports = class UniqueValidator extends Base {

    constructor (config) {
        super(Object.assign({
            targetClass: null,
            targetAttribute: null, // can be array
            filter: null,
            ignoreCase: false
        }, config));
    }

    init () {
        super.init();
        this.createMessage('message', 'Value has already been taken');
    }

    validateAttr (model, attr, cb) {
        let targetClass = this.targetClass ? this.targetClass : model.constructor;
        let attributes = this.targetAttribute ? this.targetAttribute : attr;
        let query = targetClass.find();
        if (!(attributes instanceof Array)) {
            attributes = [attributes];
        }
        if (this.ignoreCase) {
            for (let name of attributes) {
                query.andWhere(['LIKE', name, model.get(name)]);
            }
        } else {
            let params = {};
            for (let name of attributes) {
                params[name] = model.get(name);
            }
            query.andWhere(params);
        }
        if (typeof this.filter === 'function') {
            this.filter(query);
        } else if (this.filter) {
            query.andWhere(this.filter);
        }
        query.limit(2).all((err, models)=> {            
            if (err) {
                return cb(err);                    
            }
            let exists = true;
            if (models.length === 1) {
                if (targetClass === model.constructor) {
                    let id1 = model.getId();
                    let id2 = models[0].getId();
                    exists = !id1 || !helper.isEqualIds(id1, id2);
                }
            } else if (models.length === 0) {
                exists = false;
            }
            exists && this.addError(model, attr, this.message);
            cb();
        });
    }
};