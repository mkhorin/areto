/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const UrlHelper = require('../../../helper/UrlHelper');

describe('UrlHelper', ()=> {

    it('parse', ()=> {
        let res = UrlHelper.parse('host/dir#value');
        expect(res.segments).to.eql(['host', 'dir']);
        expect(res.anchor).to.eql('value');

        res = UrlHelper.parse('/host/dir1/dir2');
        expect(res.segments).to.eql(['host', 'dir1', 'dir2']);

        res = UrlHelper.parse('/host/dir/?k1=v1&k2=v2#anchor');
        expect(res.segments).to.eql(['host', 'dir']);
        expect(res.params).to.eql({k1: 'v1', k2: 'v2'});
        expect(res.anchor).to.eql('anchor');
    });

    it('serialize', ()=> {
        expect(UrlHelper.serialize(null)).to.eql('');
        expect(UrlHelper.serialize({})).to.eql('');
        expect(UrlHelper.serialize('')).to.eql('');
        expect(UrlHelper.serialize({k: 1})).to.eql('k=1');
        expect(UrlHelper.serialize({k: 1, m: 2, n: 3})).to.eql('k=1&m=2&n=3');
    });
});