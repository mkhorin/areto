/**
 * @copyright Copyright (c) 2018 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

module.exports = {
    port: 8888,
    components: {
        'logger': {
            level: 'info',
            types: {
                'error': {
                    store: require('areto/log/FileLogStore')
                }
            }
        },
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
        },
        'bodyParser': {
            limit: '10mb'
        }
    },
    modules: {        
    }
};