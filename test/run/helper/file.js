/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const FileHelper = require('../../../helper/FileHelper');

describe('FileHelper', ()=> {

    it('getBasename', ()=> {
        expect(FileHelper.getBasename('dir/file.ext')).to.eql('file');
        expect(FileHelper.getBasename('dir/file')).to.eql('file');
        expect(FileHelper.getBasename('file/')).to.eql('file');
        expect(FileHelper.getBasename('file')).to.eql('file');
    });

    it('getRelativePath', ()=> {
        let res = FileHelper.getRelativePath('root/dir', 'root/dir/base/file');
        expect(res).to.eql('base/file');
        res = FileHelper.getRelativePath('root/dir', 'other/dir/file');
        expect(res).to.eql('other/dir/file');
    });

    it('getExtension', ()=> {
        expect(FileHelper.getExtension('file.js')).to.eql('js');
        expect(FileHelper.getExtension('file')).to.eql('');
        expect(FileHelper.getExtension('file.txt.png')).to.eql('png');
        expect(FileHelper.getExtension('file.')).to.eql('');
    });

    it('addExtension', ()=> {
        expect(FileHelper.addExtension('js', 'dir/file')).to.eql('dir/file.js');
        expect(FileHelper.addExtension('js', 'dir/file.js')).to.eql('dir/file.js');
        expect(FileHelper.addExtension('js', 'dir/file.txt')).to.eql('dir/file.txt.js');
    });

    it('trimExtension', ()=> {
        expect(FileHelper.trimExtension('dir/file')).to.eql('dir/file');
        expect(FileHelper.trimExtension('dir/file.js')).to.eql('dir/file');
        expect(FileHelper.trimExtension('dir/file.base.txt')).to.eql('dir/file.base');
    });

    it('isJsonExtension', ()=> {
        expect(FileHelper.isJsonExtension('file.json')).to.eql(true);
        expect(FileHelper.isJsonExtension('file')).to.eql(false);
    });
});