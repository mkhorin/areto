/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class ActiveLinker extends Base {

    async link (name, model, extraColumns) {
        const relation = this.owner.getRelation(name);
        const method = relation.isOuterLink() ? 'linkVia' : 'linkInternal';
        await this[method](relation, model, extraColumns);
        if (!relation.isMultiple()) {
            this.owner.populateRelation(name, model); 
            return PromiseHelper.setImmediate();
        }
        const related = this.owner.getRelated(name);
        if (!related) {
            return PromiseHelper.setImmediate();            
        }
        const index = relation.getIndex();
        if (index) {
            related[index] = model;
        } else {
            related.push(model);
        }
        return PromiseHelper.setImmediate();
    }

    linkInternal (relation, model) {
        return relation.isBackRef()
            ? this.bindModels(relation.refKey, relation.linkKey, model, this.owner, relation)
            : this.bindModels(relation.linkKey, relation.refKey, this.owner, model, relation);
    }

    linkVia (relation, model, extraColumns) {
        const via = relation.getViaTable() || relation.getViaRelation();
        const columns = {
            [via.refKey]: this.owner.get(via.linkKey),
            [relation.linkKey]: model.get(relation.refKey)
        };        
        if (extraColumns) {
            Object.assign(columns, extraColumns);
        }
        if (relation.getViaTable()) {
            return this.owner.getDb().insert(via.getTable(), columns);
        }
        // unset related so that it can be reloaded to reflect the changes
        this.owner.unsetRelated(relation.getViaRelationName());
        model = this.owner.spawn(via.model.constructor);
        model.assign(columns);
        return model.insert();
    }

    async unlink (name, model, deletion) {
        const relation = this.owner.getRelation(name);
        const method = relation.isOuterLink() ? 'unlinkVia' : 'unlinkInternal';
        await this[method](relation, model, deletion);
        this.unsetUnlinked(name, model, relation);
        return PromiseHelper.setImmediate();
    }

    async unlinkInternal (relation, model) {
        const ref = model.get(relation.refKey);
        const link = this.owner.get(relation.linkKey);
        relation.isBackRef()
            ? await QueryHelper.unlinkInternal(ref, link, model, relation.refKey)
            : await QueryHelper.unlinkInternal(link, ref, this.owner, relation.linkKey);
    }

    unlinkVia (relation, model, deletion = true) {
        const via = relation.getViaTable() || relation.getViaRelation();
        const condition = {
            [via.refKey]: this.owner.get(via.linkKey),
            [relation.linkKey]: model.get(relation.refKey)
        };
        const nulls = {
            [via.refKey]: null,
            [relation.linkKey]: null
        };
        if (relation.getViaTable()) {
            return deletion
                ? this.owner.getDb().delete(via.getTable(), condition)
                : this.owner.getDb().update(via.getTable(), condition, nulls);
        }
        this.owner.unsetRelated(relation.getViaRelationName());
        return deletion
            ? via.model.find(condition).delete()
            : via.model.find(condition).updateAll(nulls);
    }

    async unlinkAll (name, deletion) {
        const relation = this.owner.getRelation(name);
        if (relation) {
            const method = relation.isOuterLink() ? 'unlinkViaAll' : 'unlinkInternalAll';
            await this[method](relation, deletion);
            this.owner.unsetRelated(name);
        }
    }

    async unlinkViaAll (relation, deletion = true) {
        if (relation.getViaRelation()) {
            this.owner.unsetRelated(relation.getViaRelationName());
        }
        const via = relation.getViaTable() || relation.getViaRelation();
        let condition = {[via.refKey]: this.owner.get(via.linkKey)};
        if (via.getWhere()) {
            condition = ['AND', condition, via.getWhere()];
        }
        let nulls = {[via.refKey]: null};
        if (relation.getViaTable()) {
            condition = this.owner.getDb().buildCondition(condition);
            deletion ? await this.owner.getDb().delete(via.getTable(), condition)
                     : await this.owner.getDb().update(via.getTable(), condition, nulls);
        } else if (deletion) {
            for (const model of await via.model.find(condition).all()) {
                await model.delete();
            }
        } else {
            await via.model.find(condition).updateAll(nulls);
        }
    }

    async unlinkInternalAll (relation) {
        // relation via array valued attribute
        if (Array.isArray(this.owner.get(relation.linkKey))) {
            this.owner.set(relation.linkKey, []);
            return this.owner.forceSave();
        }
        let condition = {[relation.refKey]: this.owner.get(relation.linkKey)};
        if (relation.getWhere()) {
            condition = ['AND', condition, relation.getWhere()];
        }
        relation.getViaArray()
            ? await relation.model.getDb().updateAllPull(relation.model.getTable(), {}, condition)
            : await relation.model.find(condition).updateAll({[relation.refKey]: null});
    }

    unsetUnlinked (name, model, relation) {
        if (!relation.isMultiple()) {
            return this.owner.unsetRelated(name);
        }
        const models = this.owner.getRelated(name);
        if (Array.isArray(models)) {
            const id = model.getId();
            const result = models.filter(target => !CommonHelper.isEqual(id, target.getId()));
            this.owner.populateRelation(name, result);
        }
    }

    bindModels (foreignKey, primaryKey, foreignModel, primaryModel, relation) {
        const value = primaryModel.get(primaryKey);
        if (!value) {
            throw new Error(this.wrapMessage('Primary key is null'));
        }
        if (!relation.getViaArray()) {
            foreignModel.set(foreignKey, value);
            return foreignModel.forceSave();
        }
        if (!Array.isArray(foreignModel.get(foreignKey))) {
            foreignModel.set(foreignKey, []);
        }
        if (!ArrayHelper.includes(value, foreignModel.get(foreignKey))) {
            foreignModel.get(foreignKey).push(value);
            return foreignModel.forceSave();
        }
    }

    wrapMessage (message) {
        return `${this.constructor.name}: ${this.owner.wrapMessage(message)}`;
    }
};

const ArrayHelper = require('../helper/ArrayHelper');
const CommonHelper = require('../helper/CommonHelper');
const PromiseHelper = require('../helper/PromiseHelper');
const QueryHelper = require('../helper/QueryHelper');