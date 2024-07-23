/**
 * @copyright Copyright (c) 2024 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const Item = require('../../../web/ForwarderItem');

describe('ForwarderItem', ()=> {

    it('resolveTarget', () => {
        const item = new Item({
            source: '/article/:action',
            target: '/book/:action',
            targetParams: {custom: true}
        });
        let target = item.resolveTarget('/article/read');
        expect(target.path).to.eql('/book/read');
        expect(target.params.action).to.eql('read');
        expect(target.params.custom).to.eql(true);

        target = item.resolveTarget('/other/read');
        expect(target).to.eql(undefined);
    });

    it('customHandler', () => {
        const item = new Item({
            source: ['/adam/:action', {strict: true}],
            target: (data, params) => {
                return `/bob/${params.action}`;
            }
        });
        const target = item.resolveTarget('/adam/walk');
        expect(target.path).to.eql('/bob/walk');
        expect(target.params.action).to.eql('walk');
    });
});