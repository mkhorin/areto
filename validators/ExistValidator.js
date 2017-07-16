'use strict';

const Base = require('./Validator');
/**
 * a1 needs to exist
 * ['a1', 'exist']
 * a1 needs to exist, but its value will use a2 to check for the existence
 * ['a1', 'exist', {targetAttr: 'a2'}]
 * a1 and a2 need to exist together, and they both will receive error message
 * [['a1', 'a2'], 'exist', {targetAttr: ['a1', 'a2']}]
 * a1 and a2 need to exist together, only a1 will receive error message
 * ['a1', 'exist', {targetAttr: ['a1', 'a2']}]
 */
module.exports = class ExistValidator extends Base {

    constructor (config) {
        super(Object.assign({
            targetClass: null,
            targetAttr: null,
            filter: null,
            ignoreCase: false
        }, config));
    }

    init () {
        super.init();
        this.createMessage('message', 'Value does not exist');
    }

    validateAttr (model, attr, cb) {
        let targetClass = this.targetClass ? this.targetClass : model.constructor;
        let attrs = this.targetAttr ? this.targetAttr : attr;
        let query = targetClass.find();
        if (!(attrs instanceof Array)){
            attrs = [attrs];
        }
        if (this.ignoreCase) {
            for (let name of attrs) {
                query.and(['LIKE', name, model.get(attr)]);
            }
        } else {
            let params = {};
            for (let name of attrs) {
                params[name] = model.get(attr);
            }
            query.and(params);
        }
        if (typeof this.filter === 'function') {
            this.filter(query, model, attr);
        } else if (this.filter) {
            query.and(this.filter);
        }
        query.count((err, count)=> {
            if (count === 0) {
                this.addError(model, attr, this.message);
            }
            cb(err);
        });
    }
};