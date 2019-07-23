/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class ActiveLinker extends Base {

    async link (name, model, extraColumns) {
        let rel = this.owner.getRelation(name);        
        let method = rel.isOuterLink() ? 'linkVia' : 'linkInner';
        await this[method].call(this, rel, model, extraColumns);
        if (!rel.isMultiple()) {
            this.owner.populateRelation(name, model); 
            return PromiseHelper.setImmediate();
        }
        let related = this.owner.getPopulatedRelation(name);
        if (!related) {
            return PromiseHelper.setImmediate();            
        }
        let index = rel.getIndex();
        if (index) {
            related[index] = model;
        } else {
            related.push(model);
        }
        return PromiseHelper.setImmediate();
    }

    linkInner (rel, model) {
        return rel.isBackRef()
            ? this.bindModels(rel.refKey, rel.linkKey, model, this.owner, rel)
            : this.bindModels(rel.linkKey, rel.refKey, this.owner, model, rel);
    }

    linkVia (rel, model, extraColumns) {
        let via = rel.getViaTable() || rel.getViaRelation();
        let columns = {
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
        let viaModel = this.owner.spawn(via.model.constructor);
        viaModel.assignAttrs(columns);
        return viaModel.insert();
    }

    linkViaModel (rel, targets, model) {
        let via = rel.getViaRelation();
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
        let rel = this.owner.getRelation(name);
        if (remove === undefined) {
            remove = rel.getRemoveOnUnlink();
        }
        let method = rel.isOuterLink() ? 'unlinkVia' : 'unlinkInner';
        await this[method].call(this, rel, model, remove);
        this.unsetUnlinked(name, model, rel);
        return PromiseHelper.setImmediate();
    }

    async unlinkInner (rel, model, remove) {
        let ref = model.get(rel.refKey);
        let link = this.owner.get(rel.linkKey);
        rel.isBackRef()
            ? await QueryHelper.unlinkInner(ref, link, model, rel.refKey)
            : await QueryHelper.unlinkInner(link, ref, this.owner, rel.linkKey);
        return remove ? model.remove() : null;
    }

    unlinkVia (rel, model, remove) {
        let via = rel.getViaTable() || rel.getViaRelation();
        let condition = {
            [via.refKey]: this.owner.get(via.linkKey),
            [rel.linkKey]: model.get(rel.refKey)
        };
        let nulls = {
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
        let rel = this.owner.getRelation(name);
        if (!rel) {
            return false;
        }
        if (remove === undefined) {
            remove = rel.getRemoveOnUnlink();
        }
        let method = rel.isOuterLink() ? 'unlinkViaAll' : 'unlinkInnerAll';
        await this[method].call(this, rel, remove);
        this.owner.unsetRelation(name);
    }

    async unlinkViaAll (rel, remove) {
        if (rel.getViaRelation()) {
            this.owner.unsetRelation(rel.getViaRelationName());
        }
        let via = rel.getViaTable() || rel.getViaRelation();
        let condition = {[via.refKey]: this.owner.get(via.linkKey)};
        let nulls = {[via.refKey]: null};
        if (via.getWhere()) {
            condition = ['AND', condition, via.getWhere()];
        }
        if (!Array.isArray(rel.remove)) {
            condition = this.owner.getDb().buildCondition(condition);
            remove ? await this.owner.getDb().remove(via.getTable(), condition)
                   : await this.owner.getDb().update(via.getTable(), condition, nulls);
        } else if (remove) {
            for (let model of await via.model.find(condition).all()) {
                await model.remove();
            }
        } else {
            await via.model.find(condition).updateAll(nulls);
        }
    }

    async unlinkInnerAll (rel, remove) {
        // rel via array valued attr
        if (!remove && Array.isArray(this.owner.get(rel.linkKey))) {
            this.owner.set(rel.linkKey, []);
            return this.owner.forceSave();
        }
        let nulls = {[rel.refKey]: null};
        let condition = {[rel.refKey]: this.owner.get(rel.linkKey)};
        if (rel.getWhere()) {
            condition = ['AND', condition, rel.getWhere()];
        }
        if (remove) {
            for (let model of await rel.all()) {
                await model.remove();
            }
        } else if (rel.getViaArray()) {
            await rel.model.getDb().updateAllPull(rel.model.TABLE, {}, condition);
        } else {
            await rel.model.find(condition).updateAll(nulls);
        }
    }

    unsetUnlinked (name, model, rel) {
        if (!rel.isMultiple()) {
            return this.owner.unsetRelation(name);
        }
        let models = this.getPopulatedRelation(name);
        if (Array.isArray(models)) {
            for (let i = models.length - 1; i >= 0; --i) {
                if (MongoHelper.isEqual(model.getId(), models[i].getId())) {
                    models.splice(i, 1);
                }
            }
        }
    }

    bindModels (foreignKey, primaryKey, foreignModel, primaryModel, rel) {
        let value = primaryModel.get(primaryKey);
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
        if (MongoHelper.indexOf(value, foreignModel.get(foreignKey)) === -1) {
            foreignModel.get(foreignKey).push(value);
            return foreignModel.forceSave();
        }
    }

    wrapMessage (message) {
        return `${this.constructor.name}: ${this.owner.wrapMessage(message)}`;
    }
};

const MongoHelper = require('../helper/MongoHelper');
const PromiseHelper = require('../helper/PromiseHelper');
const QueryHelper = require('../helper/QueryHelper');