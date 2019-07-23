/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Driver');

module.exports = class MysqlDriver extends Base {

    constructor (config) {
        super({
            schema: 'mysql',
            QueryBuilder: require('./MysqlQueryBuilder'),
            ...config
        });
        this.client = mysql.createPool(this.settings);
    }

    async openClient () {
        // try to open the first connection in the pool
        return this.getConnection();
    }

    async closeClient () {
        await PromiseHelper.promise(this.client.end, this.client);
    }

    getQueryData (data) {
        return data.err ? `${data.err.toString()}: ${data.sql}` : data.sql;
    }

    logCommand (data) {
        this.log('trace', this.settings.database, data);
    }

    // OPERATIONS

    async getConnection () {
        let connection = await PromiseHelper.promise(this.client.getConnection, this.client);
        if (connection) {
            connection.release();
        }
        return connection;
    }

    async execute (sql) {
        let connection = await this.getConnection();
        this.logCommand({sql});
        let result = await PromiseHelper.promise(connection.query, connection);
        connection.release();
        return result;
    }

    find (table, condition) {
        let sql = `SELECT * FROM ${this.escapeId(table)}`;
        if (condition) {
            sql += condition;
        }
        return this.execute(sql);
    }

    async insert (table, data) {
        let columns = this.escapeId(Object.keys(data)).join();
        let values = this.escape(Object.values(data));
        let sql = `INSERT INTO ${this.escapeId(table)} (${columns}) VALUES (${values})`;
        let result = await this.execute(sql);
        return result.insertId;
    }
    
    upsert (table, condition, data) {
        let columns = this.escapeId(Object.keys(data));
        let values = this.escape(Object.values(data));
        let updates = columns.map(column => `${column}=VALUES(${column})`).join();
        let sql = `INSERT INTO ${this.escapeId(table)} (${columns.join()}) VALUES (${values}) ON DUPLICATE KEY UPDATE ${updates}`;
        return this.execute(sql);
    }

    update (table, condition, data) {
        let values = Object.keys(data).map(key => `${this.escapeId(key)}=${this.escape(data[key])}`).join();
        let sql = `UPDATE ${this.escapeId(table)} SET ${values}`;
        if (condition) {
            sql += condition;
        }
        return this.execute(sql);
    }

    updateAll (table, condition, data) {
        throw new Error(this.wrapClassMessage('TODO'));
    }

    remove (table, condition) {
        let sql = `DELETE FROM ${this.escapeId(table)}`;
        if (condition) {
            sql += condition;
        }
        return this.execute(sql);
    }

    drop (table) {
        return this.execute(`DROP TABLE IF EXISTS ${this.escapeId(table)}`);
    }

    truncate (table) {
        return this.execute(`TRUNCATE FROM ${this.escapeId(table)}`);
    }

    create (table, fields, keys, engine = 'innodb') {
        let data = [];
        for (let name of Object.keys(fields)) {
            data.push(`${this.escapeId(name)} ${fields[name]}`);
        }
        keys && data.push(keys);
        data = data.join();
        return this.execute(`CREATE TABLE IF NOT EXISTS ${this.escapeId(table)} (${data}) engine=${engine}`);
    }

    // AGGREGATE

    async count (table, condition) {
        let sql = `SELECT COUNT(*) FROM ${table} ${condition}`;
        let result = await this.execute(sql);
        return result[0]['COUNT(*)'];
    }

    // QUERY

    async queryAll (query) {
        let cmd = await this.buildQuery(query);
        let docs = await this.execute(this.builder.stringify(cmd));
        if (!cmd.order) {
            docs = query.sortOrderByIn(docs);
        }
        return query.populate(docs);
    }

    async queryColumn (query, key) {
        let docs = await this.queryAll(query.raw().select(key));
        return docs.map(doc => doc[key]);
    }

    async queryScalar (query, key) {
        let docs = await this.queryAll(query.raw().select(key).limit(1));
        return docs.length ? docs[0] : undefined;
    }

    async queryInsert (query, data) {
        let cmd = await this.buildQuery(query);
        return this.insert(cmd.from, data);
    }

    async queryUpdate (query, data) {
        let cms = await this.buildQuery(query);
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

    // ESCAPES

    escapeId (id) {
        return Array.isArray(id)
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
        if (Array.isArray(value)) {
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

    escapeValueArray (items) {
        return list.map(item => Array.isArray(item)
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
const PromiseHelper = require('../helper/PromiseHelper');
const Expression = require('./Expression');