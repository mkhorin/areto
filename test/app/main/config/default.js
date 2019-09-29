/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {
    port: 8888,
    components: {
        'logger': {
            level: 'info',
            stores: {
                common: require('../component/ConsoleLogStore'),
                error: require('../component/ConsoleLogStore'),
            }
        },
        'db': {
            Class: require('areto/db/MongoDatabase'),
            settings: {
                'host': 'localhost',
                'port': 27017,
                'database': 'areto.test.main',
                'user': '',
                'password': ''
            }
        }
    },
    modules: {        
    }
};