/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../base/Base');

module.exports = class SessionStore extends Base {

    constructor (config) {
        super({
            userIdParam: '__id',
            ...config
        });
        Store.call(this);
    }

    /**
     * Get session data by ID
     * @param {string} id  - Session ID
     * @param {function} callback - Transmit error or session data: callback(err, data)
     */
    get (id, callback) {
        throw new Error('Need to override');
    }

    /**
     * Set session data by ID
     * @param {string} id  - Session ID
     * @param {Object} data  - Session data
     * @param {function} callback - After done
     */
    set (id, data, callback) {
        throw new Error('Need to override');
    }

    /**
     * Update session access time
     * @param {string} id  - Session ID
     * @param {Object} data  - Session data
     * @param {function} callback - After done
     */
    touch (id, data, callback) {
        throw new Error('Need to override');
    }

    /**
     * Delete session by ID
     * @param {string} id  - Session ID
     * @param {function} callback - After done
     */
    destroy (id, callback) {
        throw new Error('Need to override');
    }

    /**
     * Delete all sessions
     * @param {function} callback - After done
     */
    clear (callback) {
        throw new Error('Need to override');
    }

    /**
     * Get session by ID
     * @param id - Session ID
     * @returns {Object}
     */
    getById (id) {
        throw new Error('Need to override');
    }

    /**
     * Count sessions filtered by search
     * @param {string} search - Filter text
     * @returns {number}
     */
    count (search) {
        throw new Error('Need to override');
    }

    /**
     * Get sessions filtered by search
     * @param {number} start - Start offset
     * @param {number} length - Number of sessions
     * @param {string} search - Filter text
     * @returns {Array}
     */
    list (start, length, search) {
        throw new Error('Need to override');
    }

    /**
     * Delete expired sessions
     */
    deleteExpired () {
        throw new Error('Need to override');
    }

    /**
     * Delete session by ID
     * @param {string} id - Session ID
     */
    deleteById (id) {
        throw new Error('Need to override');
    }

    /**
     * Delete sessions by user ID
     * @param id - User ID
     */
    deleteByUserId (id) {
        throw new Error('Need to override');
    }

    createSession () {
        return Store.prototype.createSession.apply(this, arguments);
    }

    save () {
        return PromiseHelper.promise(Store.prototype.save, this);
    }

    load () {
        return Store.prototype.load.apply(this, arguments);
    }

    regenerate () {
        return Store.prototype.regenerate.apply(this, arguments);
    }
};

const session = require('express-session');
const Store = session.Store;
const PromiseHelper = require('../../helper/PromiseHelper');

Object.assign(module.exports.prototype, Object.getPrototypeOf(Store.prototype));