/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const Minifier = require('../../../../web/packer/Minifier');

describe('Minifier', ()=> {

    it('removeComments', () => {
        let text = '/***/a = 1; /* block comment */b = 2;/*//*/';
        expect(Minifier.removeComments(text)).to.eql('a = 1; b = 2;');
        text = 'a = 2 * 1; // line comment';
        expect(Minifier.removeComments(text)).to.eql('a = 2 * 1; ');
        text = `\na = 1;\nb = 2;\n`;
        expect(Minifier.removeLineBreaks(text)).to.eql(' a = 1; b = 2; ');
        text = `    a = 1;       b = 2;      `;
        expect(Minifier.removeMultipleSpaces(text)).to.eql(' a = 1; b = 2; ');
    });
});