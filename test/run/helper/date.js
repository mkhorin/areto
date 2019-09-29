/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const expect = require('chai').expect;
const moment = require('moment');
const DateHelper = require('../../../helper/DateHelper');

describe('DateHelper', ()=> {

    it('isValid', ()=> {
        expect(DateHelper.isValid(new Date)).to.eql(true);
        expect(DateHelper.isValid('1919-10-12')).to.eql(true);
        expect(DateHelper.isValid('none')).to.eql(false);
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
        const source = new Date(`${DATE}Z`);
        const target = DateHelper.getAbsolute(source);
        expect(moment(target).format(FORMAT)).to.eql(DATE);
    });
});