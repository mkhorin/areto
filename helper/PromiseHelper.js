/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class PromiseHelper {

    static delay (timeout) {
        return new Promise(resolve => setTimeout(resolve, timeout));
    }

    static setImmediate () {
        return new Promise(resolve => setImmediate(resolve));
    }

    static promise (callback) {
        return new Promise((resolve, reject)=> {
            callback((err, result)=> {
                err ? reject(err) : resolve(result);
            });
        });
    }

    static callback (promise, callback) {
        return callback
            ? promise.then(result => callback(null, result), callback)
            : promise;
    }

    static async each (items, handler) {
        if (items instanceof Array) {
            for (let item of items) {
                await handler(item);
            }
        }
    }

    static async eachOf (data, handler) {
        if (data) {
            for (let key of Object.keys(data)) {
                await handler(data[key], key);
            }
        }
    }

    static async eachMethod (items, method) {
        if (items instanceof Array) {
            for (let item of items) {
                await item[method]();
            }
        }
    }

    static async map (items, handler) {
        let result = [];
        if (items instanceof Array) {
            for (let item of items) {
                result.push(await handler(item));
            }
        }
        return result;
    }

    static async mapValues (data, handler) {
        let result = {};
        if (data) {
            for (let key of Object.keys(data)) {
                result[key] = await handler(data[key], key);
            }
        }
        return result;
    }
};