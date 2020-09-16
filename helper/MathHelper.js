/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class MathHelper {

    static random (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static round () {
        return this.adjustDecimal('round', ...arguments);
    }

    static ceil () {
        return this.adjustDecimal('ceil', ...arguments);
    }

    static floor () {
        return this.adjustDecimal('floor', ...arguments);
    }

    static adjustDecimal (type, value, precision) {
        if (!precision) {
            return Math[type](value);
        }
        if (isNaN(value) || !Number.isSafeInteger(precision)) {
            return NaN;
        }
        value = value.toString().split('e');
        value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] + precision) : precision)));
        value = value.toString().split('e');
        return +(value[0] + 'e' + (value[1] ? (+value[1] - precision) : -precision));
    }
};