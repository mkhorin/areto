/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const AssignHelper = require('../../../helper/AssignHelper');

describe('AssignHelper', ()=> {

    it('assignUndefined: assign undefined properties only', ()=> {
        const to = {a: 1, c: 2};
        const from = {a: 3, b: 4};
        AssignHelper.assignUndefined(to, from);
        expect(to.a).to.eql(1);
        expect(to.b).to.eql(4);
        expect(to.c).to.eql(2);
    });

    it('deepAssign: should assign object recursively', ()=> {
        const to = {a: {b: {c: 4, d: 5}, n: 9}};
        const from = {a: {b: {c: 7, f: 6}, n: {m: 5}}};
        AssignHelper.deepAssign(to, from);
        expect(to.a.b.c).to.eql(7);
        expect(to.a.b.d).to.eql(5);
        expect(to.a.b.f).to.eql(6);
        expect(to.a.n.m).to.eql(5);
    });
});