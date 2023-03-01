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
            const method = relation.isOuterLink()
                ? 'unlinkViaAll'
                : 'unlinkInternalAll';
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
            condition = ['and', condition, via.getWhere()];
        }
        const nulls = {[via.refKey]: null};
        if (relation.getViaTable()) {
            const db = this.owner.getDb();
            condition = db.buildCondition(condition);
            deletion ? await db.delete(via.getTable(), condition)
                     : await db.update(via.getTable(), condition, nulls);
        } else if (deletion) {
            const models = await via.model.find(condition).all();
            for (const model of models) {
                await model.delete();
            }
        } else {
            await via.model.find(condition).updateAll(nulls);
        }
    }

    async unlinkInternalAll (relation) {
        // relation via array valued attribute
        const link = this.owner.get(relation.linkKey);
        if (Array.isArray(link)) {
            return this.owner.directUpdate({[relation.linkKey]: []});
        }
        let condition = {[relation.refKey]: link};
        if (relation.getWhere()) {
            condition = ['and', condition, relation.getWhere()];
        }
        if (relation.getViaArray()) {
            const table = relation.model.getTable();
            await relation.model.getDb().updateAllPull(table, {}, condition);
        } else {
            await relation.model.find(condition).updateAll({[relation.refKey]: null});
        }
    }

    unsetUnlinked (name, model, relation) {
        if (!relation.isMultiple()) {
            return this.owner.unsetRelated(name);
        }
        const models = this.owner.getRelated(name);
        if (Array.isArray(models)) {
            const id = model.getId();
            const result = models.filter(m => !CommonHelper.isEqual(id, m.getId()));
            this.owner.populateRelation(name, result);
        }
    }

    bindModels (foreignKey, primaryKey, foreignModel, primaryModel, relation) {
        const value = primaryModel.get(primaryKey);
        if (!value) {
            throw new Error(this.wrapMessage('Primary key is null'));
        }
        if (!relation.getViaArray()) {
            return foreignModel.directUpdate({[foreignKey]: value});
        }
        let values = foreignModel.get(foreignKey);
        if (!Array.isArray(values)) {
            values = [];
        }
        if (!ArrayHelper.includes(value, values)) {
            values.push(value);
            return foreignModel.directUpdate({[foreignKey]: values});
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