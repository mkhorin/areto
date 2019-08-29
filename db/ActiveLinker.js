/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class ActiveLinker extends Base {

    async link (name, model, extraColumns) {
        const rel = this.owner.getRelation(name);
        const method = rel.isOuterLink() ? 'linkVia' : 'linkInternal';
        await this[method].call(this, rel, model, extraColumns);
        if (!rel.isMultiple()) {
            this.owner.populateRelation(name, model); 
            return PromiseHelper.setImmediate();
        }
        const related = this.owner.getPopulatedRelation(name);
        if (!related) {
            return PromiseHelper.setImmediate();            
        }
        const index = rel.getIndex();
        if (index) {
            related[index] = model;
        } else {
            related.push(model);
        }
        return PromiseHelper.setImmediate();
    }

    linkInternal (rel, model) {
        return rel.isBackRef()
            ? this.bindModels(rel.refKey, rel.linkKey, model, this.owner, rel)
            : this.bindModels(rel.linkKey, rel.refKey, this.owner, model, rel);
    }

    linkVia (rel, model, extraColumns) {
        const via = rel.getViaTable() || rel.getViaRelation();
        const columns = {
            [via.refKey]: this.owner.get(via.linkKey),
            [rel.linkKey]: model.get(rel.refKey)
        };        
        if (extraColumns) {
            Object.assign(columns, extraColumns);
        }
        if (rel.getViaTable()) {
            return this.owner.getDb().insert(via.getTable(), columns);
        }
        // unset rel so that it can be reloaded to reflect the change
        this.owner.unsetRelation(rel.getViaRelationName());
        const viaModel = this.owner.spawn(via.model.constructor);
        viaModel.assignAttrs(columns);
        return viaModel.insert();
    }

    linkViaModel (rel, targets, model) {
        const via = rel.getViaRelation();
        if (!model) {
            model = this.owner.spawn(via.model.constructor);
        } else if (!(model instanceof via.model.constructor)) {
            throw new Error(this.wrapMessage('Invalid link model'));
        }
        model.set(rel.linkKey, this.owner.get(rel.refKey));
        model.set(via.refKey, this.owner.get(via.linkKey));
        return model.save();
    }

    async unlink (name, model, remove) {
        const rel = this.owner.getRelation(name);
        if (remove === undefined) {
            remove = rel.getRemoveOnUnlink();
        }
        const method = rel.isOuterLink() ? 'unlinkVia' : 'unlinkInternal';
        await this[method].call(this, rel, model, remove);
        this.unsetUnlinked(name, model, rel);
        return PromiseHelper.setImmediate();
    }

    async unlinkInternal (rel, model, remove) {
        const ref = model.get(rel.refKey);
        const link = this.owner.get(rel.linkKey);
        rel.isBackRef()
            ? await QueryHelper.unlinkInternal(ref, link, model, rel.refKey)
            : await QueryHelper.unlinkInternal(link, ref, this.owner, rel.linkKey);
        return remove ? model.remove() : null;
    }

    unlinkVia (rel, model, remove) {
        const via = rel.getViaTable() || rel.getViaRelation();
        const condition = {
            [via.refKey]: this.owner.get(via.linkKey),
            [rel.linkKey]: model.get(rel.refKey)
        };
        const nulls = {
            [via.refKey]: null,
            [rel.linkKey]: null
        };
        if (remove === undefined) {
            remove = via.getRemoveOnUnlink();
        }
        if (rel.getViaTable()) {
            return remove ? this.owner.getDb().remove(via.getTable(), condition)
                          : this.owner.getDb().update(via.getTable(), condition, nulls);
        }
        this.owner.unsetRelation(rel.getViaRelationName());
        return remove ? via.model.find(condition).remove()
                      : via.model.find(condition).updateAll(nulls);
    }

    async unlinkAll (name, remove) {
        const rel = this.owner.getRelation(name);
        if (!rel) {
            return false;
        }
        if (remove === undefined) {
            remove = rel.getRemoveOnUnlink();
        }
        const method = rel.isOuterLink() ? 'unlinkViaAll' : 'unlinkInternalAll';
        await this[method].call(this, rel, remove);
        this.owner.unsetRelation(name);
    }

    async unlinkViaAll (rel, remove) {
        if (rel.getViaRelation()) {
            this.owner.unsetRelation(rel.getViaRelationName());
        }
        const via = rel.getViaTable() || rel.getViaRelation();
        let condition = {[via.refKey]: this.owner.get(via.linkKey)};
        if (via.getWhere()) {
            condition = ['AND', condition, via.getWhere()];
        }
        let nulls = {[via.refKey]: null};
        if (!Array.isArray(rel.remove)) {
            condition = this.owner.getDb().buildCondition(condition);
            remove ? await this.owner.getDb().remove(via.getTable(), condition)
                   : await this.owner.getDb().update(via.getTable(), condition, nulls);
        } else if (remove) {
            for (const model of await via.model.find(condition).all()) {
                await model.remove();
            }
        } else {
            await via.model.find(condition).updateAll(nulls);
        }
    }

    async unlinkInternalAll (rel, remove) {
        // rel via array valued attr
        if (!remove && Array.isArray(this.owner.get(rel.linkKey))) {
            this.owner.set(rel.linkKey, []);
            return this.owner.forceSave();
        }
        let condition = {[rel.refKey]: this.owner.get(rel.linkKey)};
        if (rel.getWhere()) {
            condition = ['AND', condition, rel.getWhere()];
        }
        const nulls = {[rel.refKey]: null};
        if (remove) {
            for (const model of await rel.all()) {
                await model.remove();
            }
        } else if (rel.getViaArray()) {
            await rel.model.getDb().updateAllPull(rel.model.getTable(), {}, condition);
        } else {
            await rel.model.find(condition).updateAll(nulls);
        }
    }

    unsetUnlinked (name, model, rel) {
        if (!rel.isMultiple()) {
            return this.owner.unsetRelation(name);
        }
        const models = this.owner.getPopulatedRelation(name);
        if (Array.isArray(models)) {
            for (let i = models.length - 1; i >= 0; --i) {
                if (CommonHelper.isEqual(model.getId(), models[i].getId())) {
                    models.splice(i, 1);
                }
            }
        }
    }

    bindModels (foreignKey, primaryKey, foreignModel, primaryModel, rel) {
        const value = primaryModel.get(primaryKey);
        if (!value) {
            throw new Error(this.wrapMessage('Primary key is null'));
        }
        if (!rel.getViaArray()) {
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