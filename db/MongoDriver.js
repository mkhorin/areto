'use strict';

const Base = require('./Driver');
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

module.exports = class MongoDriver extends Base {

    static getConstants () {
        return {
            MongoId: mongodb.ObjectID
        };
    }

    static normalizeId (id) {
        if (!(id instanceof Array)) {
            return id instanceof this.MongoId
                ? id
                : this.MongoId.isValid(id) ? this.MongoId(id) : null;
        }
        let result = [];
        for (let item of id) {
            result.push(item instanceof this.MongoId
                ? item
                : this.MongoId.isValid(item) ? this.MongoId(item) : null);
        }
        return result;
    }

    constructor (config) {
        super(Object.assign({
            client: MongoClient,
            schema: 'mongodb',
            QueryBuilder: MongoQueryBuilder
        }, config));
    }

    init () {
        super.init();
        this._collections = {};
    }

    openClient (cb) {
        this.client.connect(this.getUri(true), this.settings.options, cb);
    }

    closeClient (cb) {
        this.client.close(true, cb);
    }

    // OPERATIONS

    isCollectionExists (table, cb) {
        AsyncHelper.waterfall([
            cb => this.connection.listCollections().get(cb),
            (items, cb)=> {
                for (let item of items) {
                    if (item.name === table) {
                        return cb(null, true);
                    }
                }
                cb(null, false);
            }
        ], cb);
    }

    getCollection (table) {
        if (!this._collections[table]) {
            this._collections[table] = this.connection.collection(table);
        }
        return this._collections[table];
    }

    getCollections (cb) {
        this.connection.collections((err, results)=> {
            err && this.afterError(this.wrapClassMessage('get collections failed'));
            cb(err, results);
        });
    }

    find (table, condition, cb) {
        this.getCollection(table).find(condition).toArray((err, data)=> {
            this.afterCommand(err, {cmd: 'find', table, query: condition});
            cb(err, data);
        });
    }

    distinct (table, key, query, options, cb) {
        this.getCollection(table).distinct(key, query, options, (err, values)=> {
            this.afterCommand(err, {cmd: 'distinct', table, query});
            cb(err, values);
        });
    }

    insert (table, data, cb) {
        this.getCollection(table).insert(data, {}, (err, result)=> {
            this.afterCommand(err, {cmd: 'insert', table, data});
            err ? cb(err) : cb(null, result.insertedIds[0]);
        });
    }

    upsert (table, condition, data, cb) {
        this.getCollection(table).update(condition, {$set: data}, {upsert: true}, (err, result)=> {
            this.afterCommand(err, {cmd: 'upsert', table, query: condition, data});
            cb(err, result);
        });
    }

    update (table, condition, data, cb) {
        this.getCollection(table).update(condition, {$set: data}, {}, (err, result)=> {
            this.afterCommand(err, {cmd: 'update', table, query: condition, data});
            cb(err, result);
        });
    }

    updateAll (table, condition, data, cb) {
        this.getCollection(table).update(condition, {$set: data}, {multi: true}, (err, result)=> {
            this.afterCommand(err, {cmd: 'updateAll', table, query: condition, data});
            cb(err, result);
        });
    }

    updateAllPull (table, condition, data, cb) {
        this.getCollection(table).update(condition, {$pull: data}, {multi: true}, (err, result)=> {
            this.afterCommand(err, {cmd: 'updateAllPull', table, query: condition, data});
            cb(err, result);
        });
    }

    updateAllPush (table, condition, data, cb) {
        this.getCollection(table).update(condition, {$push: data}, {multi: true}, (err, result)=> {
            this.afterCommand(err, {cmd: 'updateAllPush', table, query: condition, data});
            cb(err, result);
        });
    }

    remove (table, condition, cb) {
        condition = condition || {};
        this.getCollection(table).remove(condition, err => {
            this.afterCommand(err, {cmd: 'remove', table, query: condition});
            cb && cb(err);
        });
    }

    drop (table, cb) {
        AsyncHelper.waterfall([
            cb => this.isCollectionExists(table, cb),
            (exists, cb)=> {
                exists ? this.getCollection(table).drop(err => {
                    this.afterCommand(err, {cmd: 'drop', table});
                    cb && cb(err);
                }) : cb();
            }
        ], cb);
    }

    truncate (table, cb) {
        this.drop(table, cb);
    }

    // AGGREGATE

    count (table, condition, cb) {
        this.getCollection(table).count(condition, (err, counter)=> {
            this.afterCommand(err, {cmd: 'count', table, query: condition});
            cb(err, counter);
        });
    }

    // QUERY

    queryAll (query, cb) {
        this.buildQuery(query, (err, cmd)=> {
            if (err) {
                return cb(err);
            }
            let cursor = this.getCollection(cmd.from).find(cmd.where, cmd.select);
            cmd.order && cursor.sort(cmd.order);
            cmd.offset && cursor.skip(cmd.offset);
            cmd.limit && cursor.limit(cmd.limit);
            cursor.toArray((err, docs)=> {
                this.afterCommand(err, {
                    cmd: 'find',
                    table: cmd.from,
                    query: cmd
                });
                if (err) {
                    return cb(err);
                }
                if (!cmd.order) {
                    docs = query.sortOrderByIn(docs);
                }
                query.populate(docs, cb);
            });
        });
    }

    queryOne (query, cb) {
        this.queryAll(query.limit(1), (err, docs)=> {
            err ? cb(err) : cb(null, docs.length ? docs[0] : null);
        });
    }

    queryColumn (query, key, cb) {
        this.queryAll(query.asRaw().select({[key]: 1}), (err, docs)=> {
            err ? cb(err) : cb(null, docs.map(doc => doc[key]));
        });
    }

    queryDistinct (query, key, cb) {
        this.buildQuery(query, (err, cmd)=> {
            err ? cb(err) : this.distinct(cmd.from, key, cmd.where, {}, cb);
        });
    }

    queryScalar (query, key, cb) {
        this.queryAll(query.asRaw().select({[key]: 1}).limit(1), (err, docs)=> {
            err ? cb(err) : cb(null, docs.length ? docs[0][key] : null);
        });
    }

    queryInsert (query, data, cb) {
        this.buildQuery(query, (err, cmd)=> {
            err ? cb(err) : this.insert(cmd.from, data, cb);
        });
    }

    queryUpdate (query, data, cb) {
        this.buildQuery(query, (err, cmd)=> {
            err ? cb(err) : this.update(cmd.from, cmd.where, data, cb);
        });
    }

    queryUpdateAll (query, data, cb) {
        this.buildQuery(query, (err, cmd)=> {
            err ? cb(err) : this.updateAll(cmd.from, cmd.where, data, cb);
        });
    }

    queryUpsert (query, data, cb) {
        this.buildQuery(query, (err, cmd)=> {
            err ? cb(err) : this.upsert(cmd.from, cmd.where, data, cb);
        });
    }

    queryRemove (query, cb) {
        this.buildQuery(query, (err, cmd)=> {
            err ? cb(err) : this.remove(cmd.from, cmd.where, cb);
        });
    }

    queryCount (query, cb) {
        this.buildQuery(query, (err, cmd)=> {
            err ? cb(err) : this.count(cmd.from, cmd.where, cb);
        });
    }

    // INDEXES

    getIndexes (table, cb) {
        this.getCollection(table).indexInformation({full: true}, cb);
    }

    /**
     * @param data [{ title:1 }, { unique: true }]
     */ 
    createIndex (table, data, cb) {
        this.getCollection(table).createIndex(data[0], data[1], err => {            
            this.afterCommand(err, {cmd: 'createIndex', table, data});
            cb(err);
        });
    }

    dropIndex (table, name, cb) {
        this.getCollection(table).dropIndex(name, err => {
            this.afterCommand(err, {cmd: 'dropIndex', table, name});
            cb(err);
        });
    }

    dropIndexes (table, cb) {
        this.getCollection(table).dropIndexes(err => {
            this.afterCommand(err, {cmd: 'dropIndexes', table});
            cb(err);
        });
    }

    reIndex (table, cb) {
        this.getCollection(table).reIndex(err => {
            this.afterCommand(err, {cmd: 'reIndex', table});
            cb(err);
        });
    }
};
module.exports.init();

const AsyncHelper = require('../helpers/AsyncHelper');
const MongoQueryBuilder = require('./MongoQueryBuilder');