/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const moment = require('moment');
const DateHelper = require('../../../helper/DateHelper');

describe('DateHelper', ()=> {

    it('isExpired', ()=> {
        expect(DateHelper.isExpired(new Date('2019-02-01'), 'P1D', new Date('2019-02-03'))).to.eql(true);
        expect(DateHelper.isExpired(new Date('2019-02-01'), 'P5D', new Date('2019-02-03'))).to.eql(false);
    });

    it('isValid', ()=> {
        expect(DateHelper.isValid(new Date)).to.eql(true);
        expect(DateHelper.isValid('1919-10-12')).to.eql(true);
        expect(DateHelper.isValid('Invalid date')).to.eql(false);
        expect(DateHelper.isValid('12-40-1905')).to.eql(false);
    });

    it('getValid', ()=> {
        const now = new Date;
        expect(DateHelper.getValid(now)).to.eql(now);
        const dateText = '2019-10-12';
        expect(DateHelper.getValid(dateText).getTime()).to.eql(new Date(dateText).getTime());
        expect(DateHelper.getValid('12-40-2015')).to.eql(null);
    });

    it('getAbsolute', ()=> {
        const FORMAT = 'YYYY-MM-DDTHH:mm:ss';
        const DATE = '2019-05-24T10:15:30';
        const source = new Date(DATE + 'Z');
        const target = DateHelper.getAbsolute(source);
        expect(moment(target).format(FORMAT)).to.eql(DATE);
    });

    it('getDayInterval', ()=> {
        const [start, end] = DateHelper.getDayInterval('2019-03-01T21:34:46');
        expect(start.toISOString()).to.eql('2019-03-01T00:00:00.000Z');
        expect(end.toISOString()).to.eql('2019-03-02T00:00:00.000Z');
        expect(DateHelper.getDayInterval('Invalid date')).to.eql(null);
    });

    it('parse', ()=> {
        expect(DateHelper.parse('03/24/2019').toISOString()).to.eql('2019-03-24T00:00:00.000Z');
        expect(DateHelper.parse('03/24/2019', 'en').toISOString()).to.eql('2019-03-24T00:00:00.000Z');
        expect(DateHelper.parse('24.03.2019', 'ru').toISOString()).to.eql('2019-03-24T00:00:00.000Z');
        expect(DateHelper.parse('Invalid date')).to.eql(null);
    });

    it('parseDuration', ()=> {
        expect(DateHelper.parseDuration(10)).to.eql(10 * 1000);
        // en.wikipedia.org/wiki/ISO_8601#Time_intervals
        expect(DateHelper.parseDuration('PT1M')).to.eql(60 * 1000);
        expect(DateHelper.parseDuration('PT1H')).to.eql(3600 * 1000);
        expect(DateHelper.parseDuration('P1D')).to.eql(24 * 3600 * 1000);
        expect(DateHelper.parseDuration('P1W')).to.eql(7 * 24 * 3600 * 1000);
        expect(DateHelper.parseDuration('P1M')).to.eql(30 * 24 * 3600 * 1000);
    });
});