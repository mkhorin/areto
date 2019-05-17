/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class CommonHelper {

    static isWinPlatform () {
        return /^win/.test(process.platform);
    }

    static parseArguments (args, keyPrefix = '--') {
        let result = {}, key;
        args = Array.isArray(args) ? args : [];
        for (let item of args) {
            if (typeof item === 'string' && item.indexOf(keyPrefix) === 0) {
                key = item.substring(keyPrefix.length);
            } else if (key !== undefined) {
                if (Array.isArray(result[key])) {
                    result[key].push(item);
                } else if (result[key] !== undefined) {
                    result[key] = [result[key], item];
                } else {
                    result[key] = item;
                }
            }
        }
        return result;
    }

    static spawnProcess (path, command, args) {
        if (this.isWinPlatform()) {
            command += '.cmd';
        }
        const childProcess = require('child_process');
        const sub = childProcess.spawn(command, args, {
            cwd: path,
            env: process.env
        });
        sub.stdout.on('data', data => console.log(`${data}`));
        sub.stderr.on('data', data => console.error(`${data}`));
        return new Promise((resolve, reject)=> {
            sub.on('error', err => reject(`Spawn process failed: ${err}`));
            sub.on('close', err => {
                err ? reject(`Spawn process: ${command}: failed: ${err}`)
                    : resolve();
            });
        });
    }
};