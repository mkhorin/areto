/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const expect = require('chai').expect;
const MathHelper = require('../../../helper/MathHelper');

describe('MathHelper', ()=> {

    it('random', ()=> {
        const res = MathHelper.random(5, 10);
        expect(res).to.be.within(5, 10);
    });

    it('round', ()=> {
        expect(MathHelper.round(12.3)).to.be.equal(12);
        expect(MathHelper.round(12.5)).to.be.equal(13);
        expect(MathHelper.round(12.7)).to.be.equal(13);

        expect(MathHelper.round(1.345, 1)).to.be.equal(1.3);
        expect(MathHelper.round(1.005, 2)).to.be.equal(1.01);

        expect(MathHelper.round(123.4, -1)).to.be.equal(120);
        expect(MathHelper.round(152.4, -2)).to.be.equal(200);
    });

    it('ceil', ()=> {
        expect(MathHelper.ceil(2.3)).to.be.equal(3);
        expect(MathHelper.ceil(2.5)).to.be.equal(3);
        expect(MathHelper.ceil(2.7)).to.be.equal(3);

        expect(MathHelper.ceil(4.123, 1)).to.be.equal(4.2);
        expect(MathHelper.ceil(45.67, -1)).to.be.equal(50);
    });

    it('floor', ()=> {
        expect(MathHelper.floor(2.3)).to.be.equal(2);
        expect(MathHelper.floor(2.5)).to.be.equal(2);
        expect(MathHelper.floor(2.7)).to.be.equal(2);

        expect(MathHelper.floor(4.28, 1)).to.be.equal(4.2);
        expect(MathHelper.floor(48.5, -1)).to.be.equal(40);
    });
});