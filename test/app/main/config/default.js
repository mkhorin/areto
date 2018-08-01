'use strict';

module.exports = {
    port: 8888,
    components: {
        'logger': {
            level: 'info',
            //store: null,
            types: {
                'error': [require('areto/log/LogType'), {
                    //exclusive: true,
                    store: [require('areto/log/FileLogStore'), {
                        baseName: 'skeleton.error'
                    }]
                }]
            }
        },
        'connection': {
            schema: 'mongodb',
            settings: {
                options: {
                    db: { bufferMaxEntries: 0 },
                    server: {
                        socketOptions: {
                            keepAlive: 1
                        }
                    }
                },
                connectionLimit: 10
            }
        },
        'bodyParser': {
            limit: '128mb'
        }
    },
    modules: {
        'cp': {},
        'export-db': {},
        'mysql': {}
    }
};