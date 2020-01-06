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
        // unset relation so that it can be reloaded to reflect the change
        this.owner.unsetRelated(relation.getViaRelationName());
        const viaModel = this.owner.spawn(via.model.constructor);
        viaModel.assignAttrs(columns);
        return viaModel.insert();
    }

    linkViaModel (relation, targets, model) {
        const via = relation.getViaRelation();
        if (!model) {
            model = this.owner.spawn(via.model.constructor);
        } else if (!(model instanceof via.model.constructor)) {
            throw new Error(this.wrapMessage('Invalid link model'));
        }
        model.set(relation.linkKey, this.owner.get(relation.refKey));
        model.set(via.refKey, this.owner.get(via.linkKey));
        return model.save();
    }

    async unlink (name, model, deleted) {
        const relation = this.owner.getRelation(name);
        if (deleted === undefined) {
            deleted = relation.getDeleteOnUnlink();
        }
        const method = relation.isOuterLink() ? 'unlinkVia' : 'unlinkInternal';
        await this[method](relation, model, deleted);
        this.unsetUnlinked(name, model, relation);
        return PromiseHelper.setImmediate();
    }

    async unlinkInternal (relation, model, deleted) {
        const ref = model.get(relation.refKey);
        const link = this.owner.get(relation.linkKey);
        relation.isBackRef()
            ? await QueryHelper.unlinkInternal(ref, link, model, relation.refKey)
            : await QueryHelper.unlinkInternal(link, ref, this.owner, relation.linkKey);
        return deleted ? model.delete() : null;
    }

    unlinkVia (relation, model, deleted) {
        const via = relation.getViaTable() || relation.getViaRelation();
        const condition = {
            [via.refKey]: this.owner.get(via.linkKey),
            [relation.linkKey]: model.get(relation.refKey)
        };
        const nulls = {
            [via.refKey]: null,
            [relation.linkKey]: null
        };
        if (deleted === undefined) {
            deleted = via.getDeleteOnUnlink();
        }
        if (relation.getViaTable()) {
            return deleted
                ? this.owner.getDb().delete(via.getTable(), condition)
                : this.owner.getDb().update(via.getTable(), condition, nulls);
        }
        this.owner.unsetRelated(relation.getViaRelationName());
        return deleted
            ? via.model.find(condition).delete()
            : via.model.find(condition).updateAll(nulls);
    }

    async unlinkAll (name, deleted) {
        const relation = this.owner.getRelation(name);
        if (!relation) {
            return false;
        }
        if (deleted === undefined) {
            deleted = relation.getDeleteOnUnlink();
        }
        const method = relation.isOuterLink() ? 'unlinkViaAll' : 'unlinkInternalAll';
        await this[method](relation, deleted);
        this.owner.unsetRelated(name);
    }

    async unlinkViaAll (relation, deleted) {
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
            deleted ? await this.owner.getDb().delete(via.getTable(), condition)
                    : await this.owner.getDb().update(via.getTable(), condition, nulls);
        } else if (deleted) {
            for (const model of await via.model.find(condition).all()) {
                await model.delete();
            }
        } else {
            await via.model.find(condition).updateAll(nulls);
        }
    }

    async unlinkInternalAll (relation, deleted) {
        // relation via array valued attr
        if (!deleted && Array.isArray(this.owner.get(relation.linkKey))) {
            this.owner.set(relation.linkKey, []);
            return this.owner.forceSave();
        }
        let condition = {[relation.refKey]: this.owner.get(relation.linkKey)};
        if (relation.getWhere()) {
            condition = ['AND', condition, relation.getWhere()];
        }
        const nulls = {[relation.refKey]: null};
        if (deleted) {
            for (const model of await relation.all()) {
                await model.delete();
            }
        } else if (relation.getViaArray()) {
            await relation.model.getDb().updateAllPull(relation.model.getTable(), {}, condition);
        } else {
            await relation.model.find(condition).updateAll(nulls);
        }
    }

    unsetUnlinked (name, model, relation) {
        if (!relation.isMultiple()) {
            return this.owner.unsetRelated(name);
        }
        const models = this.owner.getRelated(name);
        if (Array.isArray(models)) {
            for (let i = models.length - 1; i >= 0; --i) {
                if (CommonHelper.isEqual(model.getId(), models[i].getId())) {
                    models.splice(i, 1);
                }
            }
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