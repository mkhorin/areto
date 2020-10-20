/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const UrlManager = require('../../../web/UrlManager');

const stubModel = {
    getId: () => 'value'
};
const stubModule = {
    getRoute: url => `/module/${url}`,
    app: {mountPath: '/'}
};

describe('UrlManager', ()=> {

    it('create', () => {
        const url = new UrlManager({module: stubModule});
        expect(url.create('/index'))
            .to.eql('/index');
        expect(url.create('action', 'controller'))
            .to.eql('/module/controller/action');
        expect(url.create(['action'], 'controller'))
            .to.eql('/module/controller/action');
        expect(url.create(['action', {'#': 3, 'k1': 1, 'k2': 2}], 'controller'))
            .to.eql('/module/controller/action?k1=1&k2=2#3');
        expect(url.create(['action', {'#': 1}], 'controller'))
            .to.eql('/module/controller/action#1');
        expect(url.create(['controller/action']))
            .to.eql('/module/controller/action');
        expect(url.create(['controller/action', stubModel]))
            .to.eql('/module/controller/action?id=value');
    });
});