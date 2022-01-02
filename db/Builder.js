/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Builder extends Base {

    static getConstants () {
        return {
            CONDITION_METHODS: {
                'and': 'buildAndCondition',
                'or': 'buildOrCondition',
                'not': 'buildNotCondition',
                'equal': 'buildEqualCondition',
                'notEqual': 'buildNotEqualCondition',
                'between': 'buildBetweenCondition',
                'notBetween': 'buildNotBetweenCondition',
                'in': 'buildInCondition',
                'notIn': 'buildNotInCondition',
                'like': 'buildLikeCondition',
                'notLike': 'buildNotLikeCondition',
                'id': 'buildIdCondition',
                'notId': 'buildNotIdCondition',
                'false': 'buildFalseCondition',
                'empty': 'buildEmptyCondition',
                'notEmpty': 'buildNotEmptyCondition',
                'null': 'buildNullCondition',
                'notNull': 'buildNotNullCondition',
                'exists': 'buildExistsCondition',
                'notExists': 'buildNotExistsCondition'
            }
        };
    }
};
module.exports.init();