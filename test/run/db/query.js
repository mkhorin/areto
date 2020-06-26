/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const Query = require('areto/db/Query');

describe('Query', ()=> {

    it('options', async ()=> {
        const query = new Query;
        expect(query.getOptions()).to.eql(undefined);
        query.options({k1: 1});
        expect(query.getOptions()).to.eql({k1: 1});
        query.options({k2: 2});
        expect(query.getOptions()).to.eql({k2: 2});
        query.options(null);
        expect(query.getOptions()).to.eql(null);
    });

    it('addOptions', async () => {
        const query = new Query;
        query.addOptions({k1: 1});
        expect(query.getOptions()).to.eql({k1: 1});
        query.addOptions({k2: 1});
        expect(query.getOptions()).to.eql({k1: 1, k2: 1});
        query.addOptions(null);
        expect(query.getOptions()).to.eql({k1: 1, k2: 1});
    });

    it('select', async () => {
        const query = new Query;
        expect(query.getSelect()).to.eql(undefined);
        query.select('k1');
        expect(query.getSelect()).to.eql({k1: 1});
        query.select('k2');
        expect(query.getSelect()).to.eql({k2: 1});
        query.select({k3: 1});
        expect(query.getSelect()).to.eql({k3: 1});
        query.select(['k1', 'k2']);
        expect(query.getSelect()).to.eql({k1: 1, k2: 1});
    });

    it('addSelect', async () => {
        let query = new Query;
        query.addSelect('k1');
        expect(query.getSelect()).to.eql({k1: 1});
        query.addSelect('k2');
        expect(query.getSelect()).to.eql({k1: 1, k2: 1});
        query.addSelect({k3: 1});
        expect(query.getSelect()).to.eql({k1: 1, k2: 1, k3: 1});
        query.addSelect(['k4', 'k5']);
        expect(query.getSelect()).to.eql({k1: 1, k2: 1, k3: 1, k4: 1, k5: 1});
    });
});