/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const expect = require('chai').expect;
const Base = require('areto/base/Base');
const EventManager = require('areto/base/EventManager');
const Parent = require('../../app/Parent');

const owner = new Parent;
const data1 = {key1: 'value1'};
const data2 = {key2: 'value2'};

let sender, data;
let handler1 = function (event, eventData) {
    sender = event.sender;
    data = eventData;
};
let handler2 = function (event, eventData) {
    sender = event.sender;
    data = eventData;
};

describe('EventManager', ()=> {

    it('on', async ()=> {
        const em = new EventManager({owner});

        em.on('test', handler1, data1);
        sender = null;
        data = null;
        await em.trigger('test');
        expect(sender).to.eql(owner);
        expect(data).to.eql(data1);

        sender = null;
        data = null;
        await em.trigger('test');
        expect(sender).to.eql(owner);
        expect(data).to.eql(data1);

        sender = null;
        data = null;
        em.on('test', handler2, data2);
        await em.trigger('test');
        expect(sender).to.eql(owner);
        expect(data).to.eql(data2);
    });

    it('once', async ()=> {
        const em = new EventManager({owner});

        em.once('test', handler1, data1);
        sender = null;
        data = null;
        await em.trigger('test');
        expect(sender).to.eql(owner);
        expect(data).to.eql(data1);

        sender = null;
        await em.trigger('test');
        expect(sender).to.eql(null);
    });

    it('off', async ()=> {
        const em = new EventManager({owner});

        em.on('test', handler1, data1);
        sender = null;
        data = null;
        await em.trigger('test');
        expect(sender).to.eql(owner);
        expect(data).to.eql(data1);

        em.off('test');
        sender = null;
        await em.trigger('test');
        expect(sender).to.eql(null);
    });

    it('handled', async ()=> {
        const em = new EventManager({owner});

        em.on('test', (event, data)=> {
            handler1(event, data);
            event.handled = true;
        }, data1);
        em.on('test', handler2, data2);
        data = null;
        await em.trigger('test');
        expect(data).to.eql(data1);
    });
});