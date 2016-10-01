'use strict';

module.exports = {
    components: {
        'connection': {
            schema: 'mongodb',
            settings: {
                host: 'localhost',
                port: 27017,
                database: 'skeleton',
                user: '',
                password: '',
                options: {
                    db: {
                        bufferMaxEntries: 0
                    },
                    server: {
                        socketOptions: {
                            keepAlive: 1
                        }
                    }
                }
            }
        }
    }
};