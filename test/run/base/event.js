/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const expect = require('chai').expect;
const Base = require('areto/base/Base');
const Event = require('areto/base/Event');
const EventManager = require('areto/base/EventManager');
const Parent = require('../../app/Parent');
const Child = require('../../app/Child');

const Owner = Parent;
const owner = new Owner;
const customData = {key: 'value'};

let sender, data;
let handler = function (event, eventData) {
    sender = event.sender;
    data = eventData;
};

describe('Event', ()=> {

    it('on', async ()=> {
        Event.off();

        Event.on(Owner, 'test', handler, customData);
        sender = null;
        data = null;
        await Event.trigger(Owner, 'test');
        expect(sender).to.eql(Owner);
        expect(data).to.eql(customData);

        const em = new EventManager({owner});
        sender = null;
        await em.trigger('test');
        expect(sender).to.eql(owner);
    });

    it('once', async ()=> {
        Event.off();

        Event.once(Owner, 'test', handler, customData);
        sender = null;
        data = null;
        await Event.trigger(Owner, 'test');
        expect(sender).to.eql(Owner);
        expect(data).to.eql(customData);

        sender = null;
        await Event.trigger(Owner, 'test');
        expect(sender).to.eql(null);
    });

    it('off', async ()=> {
        Event.off();

        Event.on(Owner, 'test', handler);
        sender = null;
        await Event.trigger(Owner, 'test');
        expect(sender).to.eql(Owner);

        Event.off(Owner, 'test', handler);
        sender = null;
        await Event.trigger(Owner, 'test');
        expect(sender).to.eql(null);
    });

    it('inherit', async ()=> {
        Event.off();
        Event.on(Parent, 'test', handler);
        sender = null;
        await Event.trigger(Child, 'test');
        expect(sender).to.eql(Child);
        await Event.trigger(Parent, 'test');
        expect(sender).to.eql(Parent);
    });
});