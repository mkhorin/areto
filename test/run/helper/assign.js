/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const AssignHelper = require('../../../helper/AssignHelper');

describe('AssignHelper', ()=> {

    it('assignUndefined: assign undefined properties only', ()=> {
        const from = {a: 3, b: 4, d: [1, 2], e: [3, 4]};
        const to = {a: 1, c: 2, d: [5, 6]};
        AssignHelper.assignUndefined(to, from);
        expect(to.a).to.eql(1);
        expect(to.b).to.eql(4);
        expect(to.c).to.eql(2);
        expect(to.d).to.eql([5, 6]);
        expect(to.e).to.eql([3, 4]);
    });

    it('deepAssign: should assign object recursively', ()=> {
        const from = {a: {b: {c: 7, f: 6}, n: {m: 5}, a1: [1, 2]}};
        const to = {a: {b: {c: 4, d: 5}, n: 9, a1: [3, 4]}};
        AssignHelper.deepAssign(to, from);
        expect(to.a.b.c).to.eql(7);
        expect(to.a.b.d).to.eql(5);
        expect(to.a.b.f).to.eql(6);
        expect(to.a.n.m).to.eql(5);
        expect(to.a.a1).to.eql([1, 2]);
    });

    it('isExtendable', ()=> {
        expect(AssignHelper.isExtendable({a: 1})).to.eql(true);
        expect(AssignHelper.isExtendable(null)).to.eql(false);
        expect(AssignHelper.isExtendable('test')).to.eql(false);
        expect(AssignHelper.isExtendable([1, 2])).to.eql(false);
        expect(AssignHelper.isExtendable(new Date)).to.eql(false);
        expect(AssignHelper.isExtendable(/test/)).to.eql(false);
        expect(AssignHelper.isExtendable(() => {})).to.eql(false);
    });
});