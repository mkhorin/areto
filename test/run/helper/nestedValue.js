/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const expect = require('chai').expect;
const NestedValueHelper = require('../../../helper/NestedValueHelper');

describe('NestedValueHelper', ()=> {

    it('get', ()=> {
        const data = {k11: {k21: {k31: 5}}};
        let res = NestedValueHelper.get('k11.k21.k31', data);
        expect(res).to.eql(5);
        res = NestedValueHelper.get('k11.k21.none', data, 'def');
        expect(res).to.eql('def');
    });

    it('set', ()=> {
        let data = {};
        NestedValueHelper.set(5, 'k11.k21.k31', data);
        expect(NestedValueHelper.get('k11.k21.k31', data)).to.eql(5);

        data = {k11: 'not object'};
        NestedValueHelper.set(5, 'k11.k21', data);
        expect(NestedValueHelper.get('k11.k21', data)).to.eql(5);
    });

    it('includes', ()=> {
        const data = {k1: {k12: {k123: [1, 2, 3]}}, k2: {}};
        expect(NestedValueHelper.includes(2, 'k1.k12.k123', data)).to.eql(true);
        expect(NestedValueHelper.includes(2, 'k2.k12', data)).to.eql(false);
    });

    it('indexOf', ()=> {
        const data = {k1: {k12: {k123: [1, 2, 3]}}, k2: {}};
        expect(NestedValueHelper.indexOf(3, 'k1.k12.k123', data)).to.eql(2);
        expect(NestedValueHelper.indexOf(2, 'k2.k12', data)).to.eql(-1);
    });
});