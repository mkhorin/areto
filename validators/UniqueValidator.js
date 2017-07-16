'use strict';

const Base = require('./Validator');
const MainHelper = require('../helpers/MainHelper');

module.exports = class UniqueValidator extends Base {

    constructor (config) {
        super(Object.assign({
            targetClass: null,
            targetAttr: null, // can be array
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
        let attrs = this.targetAttr ? this.targetAttr : attr;
        let query = targetClass.find();
        if (!(attrs instanceof Array)) {
            attrs = [attrs];
        }
        if (this.ignoreCase) {
            for (let name of attrs) {
                query.and(['LIKE', name, model.get(name)]);
            }
        } else {
            let params = {};
            for (let name of attrs) {
                params[name] = model.get(name);
            }
            query.and(params);
        }
        if (typeof this.filter === 'function') {
            this.filter(query, model, attr);
        } else if (this.filter) {
            query.and(this.filter);
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
                    exists = !id1 || !MainHelper.isEqualIds(id1, id2);
                }
            } else if (models.length === 0) {
                exists = false;
            }
            if (exists) {
                this.addError(model, attr, this.message);
            }
            cb();
        });
    }
};