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

    formatCommandData (d) {
        let msg = `${d.table} ${d.command} `;
        if (d.query) {
            msg += `${JSON.stringify(d.query)}`;
        }
        if (d.data) {
            msg += `${JSON.stringify(d.data)}`;
        }
        return msg;
    }

    // OPERATIONS

    isCollectionExists (table, cb) {
        this.connection.listCollections().get((err, items)=> {
            if (err) {
                return cb(err);
            }
            for (let item of items) {
                if (item.name === table) {
                    return cb(null, true);
                }
            }
            return cb(null, false);
        });
    }

    getCollection (table) {
        if (!this._collections[table]) {
            this._collections[table] = this.connection.collection(table);
        }
        return this._collections[table];
    }

    getCollections (cb) {
        this.connection.collections((err, results)=> {
            err && this.afterError('MongoDriver: get collections failed');
            cb(err, results);
        });
    }

    find (table, condition, cb) {
        this.getCollection(table).find(condition).toArray((err, docs)=> {
            this.afterCommand({err, command: 'find', table, query: condition});
            cb(err, docs);
        });
    }

    insert (table, doc, cb) {
        this.getCollection(table).insert(doc, {}, (err, result)=> {
            this.afterCommand({err, command: 'insert', table, data: doc});
            err ? cb(err) : cb(null, result.insertedIds[0]);
        });
    }

    upsert (table, condition, doc, cb) {
        this.getCollection(table).update(condition, {$set: doc}, {upsert: true}, (err, result)=> {
            this.afterCommand({err, command: 'upsert', table, query: condition, data: doc});
            cb(err, result);
        });
    }

    update (table, condition, doc, cb) {
        this.getCollection(table).update(condition, {$set: doc}, {}, (err, result)=> {
            this.afterCommand({err, command: 'update', table, query: condition, data: doc});
            cb(err, result);
        });
    }

    updateAll (table, condition, doc, cb) {
        this.getCollection(table).update(condition, {$set: doc}, {multi: true}, (err, result)=> {
            this.afterCommand({err, command: 'updateAll', table, query: condition, data: doc});
            cb(err, result);
        });
    }

    updateAllPull (table, condition, doc, cb) {
        this.getCollection(table).update(condition, {$pull: doc}, {multi: true}, (err, result)=> {
            this.afterCommand({err, command: 'updateAllPull', table, query: condition, data: doc});
            cb(err, result);
        });
    }

    updateAllPush (table, condition, doc, cb) {
        this.getCollection(table).update(condition, {$push: doc}, {multi: true}, (err, result)=> {
            this.afterCommand({err, command: 'updateAllPush', table, query: condition, data: doc});
            cb(err, result);
        });
    }

    remove (table, condition, cb) {
        condition = condition || {};
        this.getCollection(table).remove(condition, err => {
            this.afterCommand({err, command: 'remove', table, query: condition});
            cb && cb(err);
        });
    }

    drop (table, cb) {
        this.isCollectionExists(table, (err, exists)=> {
            if (err || !exists) {
                return cb && cb(err);
            }
            this.getCollection(table).drop(err => {
                this.afterCommand({err, command: 'truncate', table});
                cb && cb(err);
            });
        });
    }

    truncate (table, cb) {
        this.drop(table, cb);
    }

    // AGGREGATE

    count (table, query, cb) {
        this.getCollection(table).count(query, (err, counter)=> {
            this.afterCommand({err, command: 'count', table, query});
            cb(err, counter);
        });
    }

    // QUERY

    queryBuild (query, cb) {
        query.prepare(err => {
            try {
                err ? cb(err) : cb(null, this.builder.build(query));    
            } catch (err) {
                cb(err);    
            }
        });
    }

    queryAll (query, cb) {
        this.queryBuild(query, (err, cmd)=> {
            if (err) {
                return cb(err);
            }
            let cursor = this.getCollection(cmd.from).find(cmd.where, cmd.select);
            cmd.order && cursor.sort(cmd.order);
            cmd.offset && cursor.skip(cmd.offset);
            cmd.limit && cursor.limit(cmd.limit);
            cursor.toArray((err, docs)=> {
                this.afterCommand({
                    err,
                    command: 'find',
                    table: cmd.from,
                    query: cmd
                });
                if (err) {
                    return cb(err);
                }
                if (!cmd.order) {
                    docs = query.sortOrderByIn(docs);
                    if (!docs) {
                        return cb('MongoDriver: queryAll: sortOrderByIn');
                    }
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
        this.queryAll(query.asArray().select({[key]: 1}), (err, docs)=> {
            err ? cb(err) : cb(null, docs.map(doc => doc[key]));
        });
    }

    queryScalar (query, key, cb) {
        this.queryAll(query.asArray().select({[key]: 1}).limit(1), (err, docs)=> {
            err ? cb(err) : cb(null, docs.length ? docs[0] : null);
        });
    }

    queryInsert (query, doc, cb) {
        this.queryBuild(query, (err, cmd)=> {
            err ? cb(err) : this.insert(cmd.from, doc, cb);
        });
    }

    queryUpdate (query, doc, cb) {
        this.queryBuild(query, (err, cmd)=> {
            err ? cb(err) : this.update(cmd.from, cmd.where, doc, cb);
        });
    }

    queryUpsert (query, doc, cb) {
        this.queryBuild(query, (err, cmd)=> {
            err ? cb(err) : this.upsert(cmd.from, cmd.where, doc, cb);
        });
    }

    queryRemove (query, cb) {
        this.queryBuild(query, (err, cmd)=> {
            err ? cb(err) : this.remove(cmd.from, cmd.where, cb);
        });
    }

    queryCount (query, cb) {
        this.queryBuild(query, (err, cmd)=> {
            err ? cb(err) : this.count(cmd.from, cmd.where, cb);
        });
    }

    // HELPERS

    indexOfId (id, ids) {
        if (!(id instanceof this.ObjectId)) {
            return ids.indexOf(id);
        }    
        for (let i = 0; i < ids.length; ++i) {
            if (id.equals(ids[i])) {
                return i;
            }
        }    
        return -1;
    }

    normalizeId (id) {
        if (!(id instanceof Array)) {
            return id instanceof this.ObjectId ? id
                : this.ObjectId.isValid(id) ? this.ObjectId(id) : null;
        }    
        let result = [];
        for (let item of id) {
            result.push(item instanceof this.ObjectId ? item
                : this.ObjectId.isValid(item) ? this.ObjectId(item) : null);
        }    
        return result;
    }

    // DB INDEXES

    getIndexes (table, cb) {
        this.getCollection(table).indexInformation({full: true}, cb);
    }

    /**
     * @param data [{ title:1 }, { unique: true }]
     */ 
    createIndex (table, data, cb) {
        this.getCollection(table).createIndex(data[0], data[1], err => {            
            this.afterCommand({command: 'createIndex', err, table, data});
            cb(err);
        });
    }

    dropIndex (table, name, cb) {
        this.getCollection(table).dropIndex(name, err => {
            this.afterCommand({command: 'dropIndex', err, table, name});
            cb(err);
        });
    }

    reIndex (table, cb) {
        this.getCollection(table).reIndex(err => {
            this.afterCommand({command: 'reIndex', err, table});
            cb(err);
        });
    }
}
module.exports.init();

const MongoQueryBuilder = require('./MongoQueryBuilder');