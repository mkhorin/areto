/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {
    components: {
        'connection': {
            schema: 'mongodb',
            settings: {
                host: 'localhost',
                port: 27017,
                user: '',
                password: '',
                options: {
                    bufferMaxEntries: 0,
                    keepAlive: true,
                    useNewUrlParser: true
                }
            }
        }
    }
};