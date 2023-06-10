/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {
    components: {
        'db': {
            Class: require('areto/db/MongoDatabase'),
            settings: {
                host: 'localhost',
                port: 27017,
                user: '',
                password: '',
                options: {
                    useNewUrlParser: true
                }
            }
        }
    }
};