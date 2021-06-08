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

    static promise (callback, context, ...args) {
        return new Promise(function (resolve, reject) {
            callback.call(context, ...args, function (err, result) {
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
            for (const item of items) {
                await handler.call(context, item);
            }
        }
    }

    static async eachOf (data, handler, context) {
        if (data) {
            for (const key of Object.keys(data)) {
                await handler.call(context, data[key], key);
            }
        }
    }

    static async eachMethod (items, method) {
        if (Array.isArray(items)) {
            for (const item of items) {
                await item[method]();
            }
        }
    }

    static async map (items, handler, context) {
        const result = [];
        if (Array.isArray(items)) {
            for (const item of items) {
                result.push(await handler.call(context, item));
            }
        }
        return result;
    }

    static async mapValues (data, handler, context) {
        const result = {};
        if (data) {
            for (const key of Object.keys(data)) {
                result[key] = await handler.call(context, data[key], key);
            }
        }
        return result;
    }
};