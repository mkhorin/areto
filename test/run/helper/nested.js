/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const NestedHelper = require('../../../helper/NestedHelper');

describe('NestedHelper', ()=> {

    it('get', ()=> {
        let data = {k11: {k21: {k31: 5}}};
        expect(NestedHelper.get('k11.k21.k31', data)).to.eql(5);
        expect(NestedHelper.get('k11.k21.none', data, 'def')).to.eql('def');

        data = {k11: {k21: [{k31: 1}, {k31: 2}, {k31: 3}]}};
        expect(NestedHelper.get('k11.k21.k31', data)).to.eql([1, 2, 3]);
    });

    it('getAlone', () => {
        const data = {k11: {k21: [{k31: 1}, {k31: 2}, {k31: 3}]}};
        expect(NestedHelper.getAlone('k11.k21.1', data)).to.eql({k31: 2});
        expect(NestedHelper.getAlone('k11.k21.1.k31', data)).to.eql(2);
    });

    it('set', ()=> {
        let data = {};
        NestedHelper.set(5, 'k11.k21.k31', data);
        expect(NestedHelper.get('k11.k21.k31', data)).to.eql(5);

        data = {k11: 'not object'};
        NestedHelper.set(5, 'k11.k21', data);
        expect(NestedHelper.get('k11.k21', data)).to.eql(5);
    });

    it('includes', ()=> {
        const data = {k1: {k12: {k123: [1, 2, 3]}}, k2: {}};
        expect(NestedHelper.includes(2, 'k1.k12.k123', data)).to.eql(true);
        expect(NestedHelper.includes(2, 'k2.k12', data)).to.eql(false);
    });

    it('indexOf', ()=> {
        const data = {k1: {k12: {k123: [1, 2, 3]}}, k2: {}};
        expect(NestedHelper.indexOf(3, 'k1.k12.k123', data)).to.eql(2);
        expect(NestedHelper.indexOf(2, 'k2.k12', data)).to.eql(-1);
    });
});