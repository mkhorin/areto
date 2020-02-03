/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../base/Component');

module.exports = class FilePacker extends Base {

    constructor (config) {
        super({
            active: true,
            packs: [],
            Minifier: require('./Minifier'),
            ...config
        });
    }

    async init () {
        this.createPacks();
        if (this.active) {
            await this.pack();
        }
    }

    createPacks () {
        this.packs = this.packs.map(this.createPack, this);
    }

    createPack (config) {
        return this.spawn({
            Class: require('./FilePack'),
            packer: this,
            Minifier: this.Minifier,
            ...config
        });
    }

    async pack () {
        for (const pack of this.packs) {
            await pack.pack();
        }
    }
};