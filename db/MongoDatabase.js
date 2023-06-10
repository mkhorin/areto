/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Database');

module.exports = class MongoDatabase extends Base {

    static normalizeId (value) {
        return MongoHelper.normalizeId(value);
    }

    constructor (config) {
        super({
            schema: 'mongodb',
            QueryBuilder: require('./MongoBuilder'),
            client: mongodb.MongoClient,
            ...config
        });
        this.settings.options = {
            readPreference: 'primary',
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
        await this._client?.close(true);
        this._client = null;
    }

    async isTableExists (name) {
        const collections = await this._connection.collections();
        for (const {collectionName} of collections) {
            if (name === collectionName) {
                return true;
            }
        }
    }

    async getTableNames () {
        const names = [];
        const collections = await this._connection.collections();
        for (const {collectionName} of collections) {
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

    startSession () {
        this.traceCommand('Start session');
        return this._client.startSession();
    }

    endSession (session) {
        this.traceCommand('End session');
        session.endSession();
    }

    // OPERATIONS

    create (table) {
        this.traceCommand('create', {table});
        return this._connection.createCollection(table);
    }

    find (table, query, options) {
        this.traceCommand('find', {table, query});
        return this.getTable(table).find(query, options).toArray();
    }

    distinct (table, key, query, options) {
        this.traceCommand('distinct', {table, key, query});
        return this.getTable(table).distinct(key, query, options);
    }

    async insert (table, data, options) {
        this.traceCommand('insert', {table, data});
        if (Array.isArray(data)) {
            const result = await this.getTable(table).insertMany(data, options);
            return result.insertedIds;
        }
        const result = await this.getTable(table).insertOne(data, options);
        return result.insertedId;
    }

    upsert (table, query, data, options) {
        this.traceCommand('upsert', {table, query, data});
        return this.getTable(table).updateOne(query, {$set: data}, {
            upsert: true,
            ...options
        });
    }

    update (table, query, data, options) {
        this.traceCommand('update', {table, query, data});
        return this.getTable(table).updateOne(query, {$set: data}, options);
    }

    updateAll (table, query, data, options) {
        this.traceCommand('updateAll', {table, query, data});
        return this.getTable(table).updateMany(query, {$set: data}, options);
    }

    updateAllPull (table, query, data, options) {
        this.traceCommand('updateAllPull', {table, query, data});
        return this.getTable(table).updateMany(query, {$pull: data}, options);
    }

    updateAllPush (table, query, data, options) {
        this.traceCommand('updateAllPush', {table, query, data});
        return this.getTable(table).updateMany(query, {$push: data}, options);
    }

    unset (table, query, data, options) {
        this.traceCommand('unset', {table, query, data});
        return this.getTable(table).updateOne(query, {$unset: data}, options);
    }

    unsetAll (table, query, data, options) {
        this.traceCommand('unsetAll', {table, query, data});
        return this.getTable(table).updateMany(query, {$unset: data}, options);
    }

    delete (table, query = {}, options) {
        this.traceCommand('delete', {table, query});
        return this.getTable(table).deleteMany(query, options);
    }

    async drop (table) {
        if (await this.isTableExists(table)) {
            this.traceCommand('drop', {table});
            return this.getTable(table).drop();
        }
    }

    async dropAll () {
        this.traceCommand('dropAll');
        const names = await this.getTableNames();
        for (const name of names) {
            await this.drop(name);
        }
    }

    truncate (table) {
        return this.drop(table);
    }

    async rename (table, target) {
        if (await this.isTableExists(table)) {
            this.traceCommand('rename', {table, target});
            return this._connection.renameCollection(...arguments);
        }
    }

    // AGGREGATE

    count (table, query) {
        this.traceCommand('count', {table, query});
        return this.getTable(table).countDocuments(query);
    }

    // QUERY

    async queryAll (query) {
        const cmd = await this.buildQuery(query);
        const cursor = this.getTable(cmd.from).find(cmd.where, query.getOptions());
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
        this.traceCommand('find', cmd);
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
        const data = await this.queryAll(query.raw().select(key));
        if (Array.isArray(data)) {
            return data.map(doc => doc[key]);
        }
        for (const name of Object.keys(data)) {
            data[name] = data[name][key];
        }
        return data;
    }

    async queryDistinct (query, key) {
        const cmd = await this.buildQuery(query);
        return this.distinct(cmd.from, key, cmd.where, query.getOptions());
    }

    async queryScalar (query, key) {
        const docs = await this.queryAll(query.raw().select(key).limit(1));
        return docs.length ? docs[0][key] : undefined;
    }

    async queryInsert (query, data) {
        const cmd = await this.buildQuery(query);
        return this.insert(cmd.from, data, query.getOptions());
    }

    async queryUpdate (query, data) {
        const cmd = await this.buildQuery(query);
        return this.update(cmd.from, cmd.where, data, query.getOptions());
    }

    async queryUpdateAll (query, data) {
        const cmd = await this.buildQuery(query);
        return this.updateAll(cmd.from, cmd.where, data, query.getOptions());
    }

    async queryUpsert (query, data) {
        const cmd = await this.buildQuery(query);
        return this.upsert(cmd.from, cmd.where, data, query.getOptions());
    }

    async queryDelete (query) {
        const cmd = await this.buildQuery(query);
        return this.delete(cmd.from, cmd.where, query.getOptions());
    }

    async queryCount (query) {
        const cmd = await this.buildQuery(query);
        return this.count(cmd.from, cmd.where, query.getOptions());
    }

    // INDEXES

    getIndexes (table, params = {full: true}) {
        return this.getTable(table).indexInformation(params);
    }

    /**
     * @param table
     * @param data [{key: 1}, {name: [name], unique: true, ...}]
     */
    async createIndex (table, data) {
        if (!await this.isTableExists(table)) {
            await this.create(table);
        }
        this.traceCommand('createIndex', {table, data});
        return this.getTable(table).createIndex(...data);
    }

    async dropIndex (table, name) {
        if (await this.isTableExists(table)) {
            this.traceCommand('dropIndex', {table, name});
            return this.getTable(table).dropIndex(name);
        }
    }

    async dropIndexes (table) {
        if (await this.isTableExists(table)) {
            this.traceCommand('dropIndexes', {table});
            return this.getTable(table).dropIndexes();
        }
    }

    async transact (handler) {
        if (!this.enableTransactions) {
            return handler();
        }
        const session = this.startSession();
        session.startTransaction();
        try {
            await handler({session});
        } finally {
            await session.abortTransaction();
            this.endSession(session);
        }
    }
};
module.exports.init();

const MongoHelper = require('../helper/MongoHelper');
const mongodb = require('mongodb');