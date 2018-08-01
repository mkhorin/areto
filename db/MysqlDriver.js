'use strict';

const Base = require('./Driver');

module.exports = class MysqlDriver extends Base {

    constructor (config) {
        super(Object.assign({
            schema: 'mysql',
            QueryBuilder: MysqlQueryBuilder
        }, config));
    }

    init () {
        super.init();
        this.client = mysql.createPool(this.settings);
    }

    openClient (cb) {
        // try to open the first connection in the pool
        this.client.getConnection((err, connection)=> {
            if (connection) {
                connection.release();
            }
            cb(err, connection);
        });
    }

    closeClient (cb) {
        this.client.end(cb);
    }

    getQueryData (data) {
        return data.err ? `${data.err.toString()}: ${data.sql}` : data.sql;
    }

    // OPERATIONS

    getConnection (cb) {
        this.client.getConnection((err, connection)=> {
            if (err && connection) {
                connection.release();
            }
            cb(err, connection);
        });
    }

    execute (sql, cb) {
        this.getConnection((err, connection)=> {
            if (err) {
                return cb(err);
            }
            connection.query(sql, (err, results, fields)=> {
                connection.release();
                this.afterCommand(err, {sql});
                cb(err, results);
            });
        });
    }

    find (table, condition, cb) {
        let sql = `SELECT * FROM ${this.escapeId(table)}`;
        if (condition) {
            sql += condition;
        }
        this.execute(sql, cb);
    }

    insert (table, data, cb) {
        let columns = this.escapeId(Object.keys(data)).join(',');
        let values = this.escape(Object.values(data));
        let sql = `INSERT INTO ${this.escapeId(table)} (${columns}) VALUES (${values})`;
        this.execute(sql, (err, result)=> {
            err ? cb(err) : cb(null, result.insertId);
        });
    }
    
    upsert (table, condition, data, cb) {
        let columns = this.escapeId(Object.keys(data));
        let values = this.escape(Object.values(data));
        let updates = columns.map(column => `${column}=VALUES(${column})`).join(',');
        let sql = `INSERT INTO ${this.escapeId(table)} (${columns.join(',')}) VALUES (${values}) ON DUPLICATE KEY UPDATE ${updates}`;
        this.execute(sql, cb);
    }

    update (table, condition, data, cb) {
        let values = Object.keys(data).map(key => `${this.escapeId(key)}=${this.escape(data[key])}`).join(',');
        let sql = `UPDATE ${this.escapeId(table)} SET ${values}`;
        if (condition) {
            sql += condition;
        }
        this.execute(sql, cb);
    }

    updateAll (table, condition, data, cb) {
        cb(this.wrapClassMessage('updateAll: TODO...'));
    }

    remove (table, condition, cb) {
        let sql = `DELETE FROM ${this.escapeId(table)}`;
        if (condition) {
            sql += condition;
        }
        this.execute(sql, cb);
    }

    drop (table, cb) {
        this.execute(`DROP TABLE IF EXISTS ${this.escapeId(table)}`, cb);
    }

    truncate (table, cb) {
        this.execute(`TRUNCATE FROM ${this.escapeId(table)}`, cb);
    }

    create (table, fields, keys, cb, engine = 'innodb') {
        let data = [];
        for (let name of Object.keys(fields)) {
            data.push(`${this.escapeId(name)} ${fields[name]}`);
        }
        keys && data.push(keys);
        data = data.join(',');
        this.execute(`CREATE TABLE IF NOT EXISTS ${this.escapeId(table)} (${data}) engine=${engine}`, cb);
    }

    // AGGREGATE

    count (table, where, cb) {
        let sql = `SELECT COUNT(*) FROM ${table} ${where}`;
        this.execute(sql, (err, results)=> {
            err ? cb(err) : cb(null, results[0]['COUNT(*)']);
        });
    }

    // QUERY

    queryAll (query, cb) {
        this.buildQuery(query, (err, cmd)=> {
            if (err) {
                return cb(err);
            }
            this.execute(this.builder.stringify(cmd), (err, docs)=> {
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

    queryColumn (query, key, cb) {        
        this.queryAll(query.asRaw().select({[key]: 1}), (err, docs)=> {
            err ? cb(err) : cb(null, docs.map(doc => doc[key]));
        });
    }

    queryScalar (query, key, cb) {
        this.queryAll(query.asRaw().select({[key]: 1}).limit(1), (err, docs)=> {
            err ? cb(err) : cb(null, docs.length ? docs[0] : null);
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

    // ESCAPES

    escapeId (id) {
        return id instanceof Array 
            ? id.map(id => this.escapeOneId(id)) 
            : this.escapeOneId(id);
    }

    escapeOneId (id) {
        return id.charAt(0) === '`' ? id : ('`'+ id +'`');
    }

    escape (value) {
        if (value === undefined || value === null) {
            return 'NULL';
        }
        switch (typeof value) {
            case 'boolean': return value ? 'TRUE' : 'FALSE';
            case 'number': return value.toString();
        }
        if (value instanceof Date) {
            value = moment(value).format('YYYY-MM-DD HH:mm:ss')
        }
        if (value instanceof Array) {
            return this.escapeValueArray(value);
        }
        if (value instanceof Expression) {
            return value.get(this);
        }
        value = value.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function(s) {
            switch (s) {
                case "\0": return "\\0";
                case "\n": return "\\n";
                case "\r": return "\\r";
                case "\b": return "\\b";
                case "\t": return "\\t";
                case "\x1a": return "\\Z";
                default: return "\\"+ s;
            }
        });
        return `'${value}'`;
    }

    escapeValueArray (list) {
        return list.map(item => item instanceof Array
            ? this.escapeValueArray(item)
            : this.escape(item)
        ).join();
    }

    // DB INDEXES
    // TODO
};
module.exports.init();

const moment = require('moment');
const mysql = require('mysql');
const AsyncHelper = require('../helper/AsyncHelper');
const MysqlQueryBuilder = require('./MysqlQueryBuilder');
const Expression = require('./Expression');