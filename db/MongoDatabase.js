/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Database');
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectID;

module.exports = class MongoDatabase extends Base {

    static normalizeId (value) {
        return Array.isArray(value)
            ? value.map(this.normalizeObjectId, this)
            : this.normalizeObjectId(value);
    }

    static normalizeObjectId (value) {
        return value instanceof ObjectId ? value : ObjectId.isValid(value) ? ObjectId(value) : null;
    }

    constructor (config) {
        super({
            schema: 'mongodb',
            QueryBuilder: require('./MongoBuilder'),
            client: mongodb.MongoClient,
            ...config
        });
        this.settings.options = {
            bufferMaxEntries: 0,
            keepAlive: true,
            useNewUrlParser: true,
            useUnifiedTopology: true,
            ...this.settings.options
        };
        this._tableMap = {};
    }

    async openConnection () {
        this._client = await this.client.connect(this.getUri(true), this.settings.options);
        return this._client.db();
    }

    async closeConnection () {
        if (this._client) {
            await this._client.close(true);
            this._client = null;
        }
    }

    async isTableExists (name) {
        for (const {collectionName} of await this._connection.collections()) {
            if (name === collectionName) {
                return true;
            }
        }
    }

    async getTableNames () {
        const names = [];
        for (const {collectionName} of await this._connection.collections()) {
            names.push(collectionName);
        }
        return names;
    }

    getTable (name) {
        if (!this._tableMap[name]) {
            this._tableMap[name] = this._connection.collection(name);
        }
        return this._tableMap[name];
    }

    // OPERATIONS

    create (table) {
        this.logCommand('create', {table});
        return this._connection.createCollection(table);
    }

    find (table, query) {
        this.logCommand('find', {table, query});
        return this.getTable(table).find(query).toArray();
    }

    distinct (table, key, query, options) {
        this.logCommand('distinct', {table, query});
        return this.getTable(table).distinct(key, query, options);
    }

    async insert (table, data) {
        this.logCommand('insert', {table, data});
        if (Array.isArray(data)) {
            const result = await this.getTable(table).insertMany(data);
            return result.insertedIds;
        }
        const result = await this.getTable(table).insertOne(data);
        return result.insertedId;
    }

    upsert (table, query, data) {
        this.logCommand('upsert', {table, query, data});
        return this.getTable(table).updateOne(query, {$set: data}, {upsert: true});
    }

    update (table, query, data) {
        this.logCommand('update', {table, query, data});
        return this.getTable(table).updateOne(query, {$set: data});
    }

    updateAll (table, query, data) {
        this.logCommand('updateAll', {table, query, data});
        return this.getTable(table).updateMany(query, {$set: data});
    }

    updateAllPull (table, query, data) {
        this.logCommand('updateAllPull', {table, query, data});
        return this.getTable(table).updateMany(query, {$pull: data});
    }

    updateAllPush (table, query, data) {
        this.logCommand('updateAllPush', {table, query, data});
        return this.getTable(table).updateMany(query, {$push: data});
    }

    unset (table, query, data) {
        this.logCommand('unset', {table, query, data});
        return this.getTable(table).updateOne(query, {$unset: data});
    }

    unsetAll (table, query, data) {
        this.logCommand('unsetAll', {table, query, data});
        return this.getTable(table).updateMany(query, {$unset: data});
    }

    delete (table, query = {}) {
        this.logCommand('delete', {table, query});
        return this.getTable(table).deleteMany(query);
    }

    async drop (table) {
        if (await this.isTableExists(table)) {
            this.logCommand('drop', {table});
            return this.getTable(table).drop();
        }
    }

    async dropAll () {
        this.logCommand('dropAll');
        for (const name of await this.getTableNames()) {
            await this.drop(name);
        }
    }

    truncate (table) {
        return this.drop(table);
    }

    async rename (table, target) {
        if (await this.isTableExists(table)) {
            this.logCommand('rename', {table, target});
            return this._connection.renameCollection(...arguments);
        }
    }

    // AGGREGATE

    count (table, query) {
        this.logCommand('count', {table, query});
        return this.getTable(table).countDocuments(query);
    }

    // QUERY

    async queryAll (query) {
        const cmd = await this.buildQuery(query);
        const cursor = this.getTable(cmd.from).find(cmd.where);
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
            docs = query.sortOrderByKeys(docs);
        }
        return query.populate(docs);
    }

    async queryOne (query) {
        const docs = await this.queryAll(query.limit(1));
        return docs.length ? docs[0] : null;
    }

    async queryColumn (query, key) {
        const docs = await this.queryAll(query.raw().select(key));
        return docs.map(doc => doc[key]);
    }

    async queryDistinct (query, key) {
        const cmd = await this.buildQuery(query);
        return this.distinct(cmd.from, key, cmd.where, {});
    }

    async queryScalar (query, key) {
        const docs = await this.queryAll(query.raw().select(key).limit(1));
        return docs.length ? docs[0][key] : undefined;
    }

    async queryInsert (query, data) {
        const cmd = await this.buildQuery(query);
        return this.insert(cmd.from, data);
    }

    async queryUpdate (query, data) {
        const cmd = await this.buildQuery(query);
        return this.update(cmd.from, cmd.where, data);
    }

    async queryUpdateAll (query, data) {
        const cmd = await this.buildQuery(query);
        return this.updateAll(cmd.from, cmd.where, data);
    }

    async queryUpsert (query, data) {
        const cmd = await this.buildQuery(query);
        return this.upsert(cmd.from, cmd.where, data);
    }

    async queryDelete (query) {
        const cmd = await this.buildQuery(query);
        return this.delete(cmd.from, cmd.where);
    }

    async queryCount (query) {
        const cmd = await this.buildQuery(query);
        return this.count(cmd.from, cmd.where);
    }

    // INDEXES

    getIndexes (table, params = {full: true}) {
        return this.getTable(table).indexInformation(params);
    }

    /**
     * @param table
     * @param data [{key: 1}, { name: [name], unique: true, ... }]
     */ 
    async createIndex (table, data) {
        await this.create(table);
        this.logCommand('createIndex', {table, data});
        return this.getTable(table).createIndex(...data);
    }

    async dropIndex (table, name) {
        if (await this.isTableExists(table)) {
            this.logCommand('dropIndex', {table, name});
            return this.getTable(table).dropIndex(name);
        }
    }

    async dropIndexes (table) {
        if (await this.isTableExists(table)) {
            this.logCommand('dropIndexes', {table});
            return this.getTable(table).dropIndexes();
        }
    }

    async reindex (table) {
        if (await this.isTableExists(table)) {
            this.logCommand('reindex', {table});
            return this.getTable(table).reIndex();
        }
    }
};
module.exports.init();