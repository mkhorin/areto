'use strict';

const Base = require('./Validator');
/**
 * a1 needs to exist
 * ['a1', 'exist']
 * a1 needs to exist, but its value will use a2 to check for the existence
 * ['a1', 'exist', {targetAttribute: 'a2'}]
 * a1 and a2 need to exist together, and they both will receive error message
 * [['a1', 'a2'], 'exist', {targetAttribute: ['a1', 'a2']}]
 * a1 and a2 need to exist together, only a1 will receive error message
 * ['a1', 'exist', {targetAttribute: ['a1', 'a2']}]
 */
module.exports = class ExistValidator extends Base {

    constructor (config) {
        super(Object.assign({
            targetClass: null,
            targetAttribute: null,
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
        let attributes = this.targetAttribute ? this.targetAttribute : attr;
        let query = targetClass.find();
        if (!(attributes instanceof Array)){
            attributes = [attributes];
        }
        if (this.ignoreCase) {
            for (let name of attributes) {
                query.andWhere(['LIKE', name, model.get(attr)]);
            }
        } else {
            let params = {};
            for (let name of attributes) {
                params[name] = model.get(attr);
            }
            query.andWhere(params);
        }
        if (typeof this.filter === 'function') {
            this.filter(query);
        } else if (this.filter) {
            query.andWhere(this.filter);
        }
        query.count((err, count)=> {
            if (count === 0) {
                this.addError(model, attr, this.message);
            }
            cb(err);
        });
    }
};