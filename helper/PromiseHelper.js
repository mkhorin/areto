/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class PromiseHelper {

    static setTimeout (timeout) {
        return new Promise(resolve => setTimeout(resolve, timeout));
    }

    static setImmediate () {
        return new Promise(resolve => setImmediate(resolve));
    }

    static promise (callback, context) {
        return new Promise((resolve, reject)=> {
            callback.call(context, (err, result)=> {
                err ? reject(err) : resolve(result);
            });
        });
    }

    static callback (promise, callback) {
        return callback
            ? promise.then(result => callback(null, result), callback)
            : promise;
    }

    static async each (items, handler, context) {
        if (Array.isArray(items)) {
            for (let item of items) {
                await handler.call(context, item);
            }
        }
    }

    static async eachOf (data, handler, context) {
        if (data) {
            for (let key of Object.keys(data)) {
                await handler.call(context, data[key], key);
            }
        }
    }

    static async eachMethod (items, method) {
        if (Array.isArray(items)) {
            for (let item of items) {
                await item[method]();
            }
        }
    }

    static async map (items, handler, context) {
        let result = [];
        if (Array.isArray(items)) {
            for (let item of items) {
                result.push(await handler.call(context, item));
            }
        }
        return result;
    }

    static async mapValues (data, handler, context) {
        let result = {};
        if (data) {
            for (let key of Object.keys(data)) {
                result[key] = await handler.call(context, data[key], key);
            }
        }
        return result;
    }
};