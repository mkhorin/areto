/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Driver');
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

module.exports = class MongoDriver extends Base {

    static getConstants () {
        return {
            ObjectId: mongodb.ObjectID
        };
    }

    static normalizeId (value) {
        return value instanceof Array
            ? value.map(this.normalizeObjectId.bind(this))
            : this.normalizeObjectId(value);
    }

    static normalizeObjectId (id) {
        return id instanceof this.ObjectId
            ? id
            : this.ObjectId.isValid(id)
                ? this.ObjectId(id)
                : null;
    }

    constructor (config) {
        super({
            'client': MongoClient,
            'schema': 'mongodb',
            'QueryBuilder': MongoQueryBuilder,
            ...config
        });
        this._collections = {};
    }

    async openClient () {
        this._client = await this.client.connect(this.getUri(true), this.settings.options);
        return this._client.db();
    }

    async closeClient () {
        if (this._client) {
            await this._client.close(true);
            this._client = null;
        }
    }

    // OPERATIONS

    async isCollectionExists (name) {
        let items = await this.connection.listCollections().get();
        return !!ArrayHelper.searchByProp(name, 'name', items);
    }

    getCollection (name) {
        if (!this._collections[name]) {
            this._collections[name] = this.connection.collection(name);
        }
        return this._collections[name];
    }

    getCollections () {
        try {
            return this.connection.collections();
        } catch (err) {
            this.afterError(this.wrapClassMessage('Get collections failed'));
            throw err;
        }
    }

    find (table, query) {
        this.logCommand('find', {table, query});
        return this.getCollection(table).find(query).toArray();
    }

    distinct (table, key, query, options) {
        this.logCommand('distinct', {table, query});
        return this.getCollection(table).distinct(key, query, options);
    }

    async insert (table, data) {
        this.logCommand('insert', {table, data});
        if (data instanceof Array) {
            let result = await this.getCollection(table).insertMany(data);
            return result.insertedIds;
        }
        let result = await this.getCollection(table).insertOne(data);
        return result.insertedId;
    }

    upsert (table, query, data) {
        this.logCommand('upsert', {table, query, data});
        return this.getCollection(table).updateOne(query, {$set: data}, {upsert: true});
    }

    update (table, query, data) {
        this.logCommand('update', {table, query, data});
        return this.getCollection(table).updateOne(query, {$set: data});
    }

    updateAll (table, query, data) {
        this.logCommand('updateAll', {table, query, data});
        return this.getCollection(table).updateMany(query, {$set: data});
    }

    updateAllPull (table, query, data) {
        this.logCommand('updateAllPull', {table, query, data});
        return this.getCollection(table).updateMany(query, {$pull: data});
    }

    updateAllPush (table, query, data) {
        this.logCommand('updateAllPush', {table, query, data});
        return this.getCollection(table).updateMany(query, {$push: data});
    }

    remove (table, query = {}) {
        this.logCommand('remove', {table, query});
        return this.getCollection(table).deleteMany(query);
    }

    async drop (table) {
        if (await this.isCollectionExists(table)) {
            this.logCommand('drop', {table});
            await this.getCollection(table).drop();
        }
    }

    truncate (table) {
        return this.drop(table);
    }

    // AGGREGATE

    count (table, query) {
        this.logCommand('count', {table, query});
        return this.getCollection(table).countDocuments(query);
    }

    // QUERY

    async queryAll (query) {
        let cmd = await this.buildQuery(query);
        let cursor = this.getCollection(cmd.from).find(cmd.where);
        if (cmd.select) {
            cursor.project(cmd.select);
        }
        if (cmd.order) {
            cursor.sort(cmd.order);
        }
        if (cmd.offset) {
            cursor.skip(cmd.offset);
        }
        if (cmd.limit) {
            cursor.limit(cmd.limit);
        }
        this.logCommand('find', cmd);
        let docs = await cursor.toArray();
        if (!cmd.order) {
            docs = query.sortOrderByIn(docs);
        }
        return query.populate(docs);
    }

    async queryOne (query) {
        let docs = await this.queryAll(query.limit(1));
        return docs.length ? docs[0] : null;
    }

    async queryColumn (query, key) {
        let docs = await this.queryAll(query.asRaw().select({[key]: 1}));
        return docs.map(doc => doc[key]);
    }

    async queryDistinct (query, key) {
        let cmd = await this.buildQuery(query);
        return this.distinct(cmd.from, key, cmd.where, {});
    }

    async queryScalar (query, key) {
        let docs = await this.queryAll(query.asRaw().select({[key]: 1}).limit(1));
        return docs.length ? docs[0][key] : undefined;
    }

    async queryInsert (query, data) {
        let cmd = await this.buildQuery(query);
        return this.insert(cmd.from, data);
    }

    async queryUpdate (query, data) {
        let cmd = await this.buildQuery(query);
        return this.update(cmd.from, cmd.where, data);
    }

    async queryUpdateAll (query, data) {
        let cmd = await this.buildQuery(query);
        return this.updateAll(cmd.from, cmd.where, data);
    }

    async queryUpsert (query, data) {
        let cmd = await this.buildQuery(query);
        return this.upsert(cmd.from, cmd.where, data);
    }

    async queryRemove (query) {
        let cmd = await this.buildQuery(query);
        return this.remove(cmd.from, cmd.where);
    }

    async queryCount (query) {
        let cmd = await this.buildQuery(query);
        return this.count(cmd.from, cmd.where);
    }

    // INDEXES

    getIndexes (table) {
        return this.getCollection(table).indexInformation({full: true});
    }

    /**
     * @param table
     * @param data [{ title:1 }, { unique: true }]
     */ 
    createIndex (table, data) {
        this.logCommand('createIndex', {table, data});
        return this.getCollection(table).createIndex(data[0], data[1]);
    }

    dropIndex (table, name) {
        this.logCommand('dropIndex', {table, name});
        return this.getCollection(table).dropIndex(name);
    }

    dropIndexes (table) {
        this.logCommand('dropIndexes', {table});
        return this.getCollection(table).dropIndexes();
    }

    reIndex (table) {
        this.logCommand('reIndex', {table});
        return this.getCollection(table).reIndex();
    }
};
module.exports.init();

const MongoQueryBuilder = require('./MongoQueryBuilder');