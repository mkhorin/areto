/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const expect = require('chai').expect;
const SystemHelper = require('../../../helper/SystemHelper');

describe('SystemHelper', ()=> {

    it('parseArguments', ()=> {
        let data = '--action apply --file f1 f2 --none --item test';
        let res = SystemHelper.parseArguments(data.split(' '));
        expect(res).to.eql({
            action: 'apply',
            file: ['f1', 'f2'],
            item: 'test'
        });
        expect(res.none).to.eql(undefined);
    });
});