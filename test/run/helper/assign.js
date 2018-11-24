/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const expect = require('chai').expect;
const AssignHelper = require('../../../helper/AssignHelper');

describe('AssignHelper', ()=> {

    it('deepAssign: should assign object recursively', ()=> {
        let to = {a: {b: {c: 4, d: 5}, n: 9}};
        let from = {a: {b: {c: 7, f: 6}, n: {m: 5}}};
        AssignHelper.deepAssign(to, from);
        expect(to.a.b.c).to.eql(7);
        expect(to.a.b.d).to.eql(5);
        expect(to.a.b.f).to.eql(6);
        expect(to.a.n.m).to.eql(5);
    });
});