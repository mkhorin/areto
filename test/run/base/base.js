/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const expect = require('chai').expect;
const Base = require('areto/base/Base');

class Test extends Base {

    static getConstants () {
        return {
            TEST: 'test'
        };
    }
}
Test.init(module);

class Test2 extends Base {
}

describe('Base', ()=> {

    it('init', async ()=> {
        const test = new Test;

        expect(Test.CLASS_FILE).to.eql(module.filename);
        expect(Test.CLASS_DIR).to.eql(__dirname);
        expect(Test.TEST).to.eql('test');

        expect(test.CLASS_FILE).to.eql(Test.CLASS_FILE);
        expect(test.CLASS_DIR).to.eql(Test.CLASS_DIR);
        expect(test.TEST).to.eql(Test.TEST);
    });

    it('wrapClassMessage', async ()=> {
        const test = new Test;
        const result = 'Test: message';
        expect(Test.wrapClassMessage('message')).to.eql(result);
        expect(test.wrapClassMessage('message')).to.eql(result);
    });

    it('constructor', async ()=> {
        const config = {a: 1};
        const test = new Test(config);
        expect(test.a).to.eql(1);
    });

    it('spawn', async ()=> {
        const config = {module: this};
        const source = new Test(config);

        let target = source.spawnSelf();
        expect(target instanceof Test).to.eql(true);
        expect(target.module).to.eql(this);

        target = source.spawnSelf({module: source});
        expect(target instanceof Test).to.eql(true);
        expect(target.module).to.eql(source);

        target = source.spawn(Test2);
        expect(target instanceof Test2).to.eql(true);
        expect(target.module).to.eql(this);

        target = source.spawn({
            Class: Test2,
            module: source
        });
        expect(target instanceof Test2).to.eql(true);
        expect(target.module).to.eql(this);
    });
});