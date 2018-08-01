'use strict';

const Base = require('../base/Action');

module.exports = class Captcha extends Base {

    constructor (config) {
        super(Object.assign({
            minLength: 5,
            maxLength: 5,
            width: 180,
            height: 60,
            backColor: '#ffffff00', // rgba
            foreColor: '#00000000',
            offset: -2,
            symbolPool: '0123456789',
            fontFile: path.join(__dirname, 'CaptchaFont.ttf'),
            fixedVerifyCode: null,
            quality: 30
        }, config));
    }

    run () {
        this.renderImage(this.getVerifyCode(true), err => this.complete(err));
    }

    validate (value) {
        return value.toLowerCase() === this.getVerifyCode();
    }

    getVerifyCode (renew) {
        if (this.fixedVerifyCode !== null) {
            return this.fixedVerifyCode;
        }
        let session = this.controller.req.session;
        let name = this.getSessionKey();
        if (!session[name] || renew) {
            session[name] = this.generateVerifyCode();
        }
        return session[name];
    }

    getSessionKey () {
        return `__captcha/${this.getUniqueName()}`;
    }

    generateVerifyCode () {
        let length = CommonHelper.getRandom(this.minLength, this.maxLength);
        let buffer = [];
        for (let i = 0; i < length; ++i) {
            buffer.push(this.symbolPool.charAt(CommonHelper.getRandom(0, this.symbolPool.length - 1)));
        }
        return buffer.join('');
    }

    renderImage (code, cb) {
        let w = this.width, h = this.height;
        let image = gm(w, h, this.backColor);
        image.fill(this.foreColor);
        image.font(this.fontFile);
        //image.affine(5,5);
        let step = (w - 0) / code.length + this.offset;
        for (let i = 0; i < code.length; ++i) {
            image.fontSize(`${CommonHelper.getRandom(25, 65)}px`);
            let angle = CommonHelper.getRandom(-16, 16);
            this.drawText(image, i * step + 10, CommonHelper.getRandom(35, 60), code[i], angle);
        }
        let downB = 20, topB = 20; //частота сетки
        for (let x = 4; x < w; x += step) {
            image.drawLine(CommonHelper.getRandom(0, w), 0, CommonHelper.getRandom(0, w), h);
            step = CommonHelper.getRandom(downB, topB);
        }
        for (let y = 3; y < h; y += step) {
            image.drawLine(0, CommonHelper.getRandom(0, w), w, CommonHelper.getRandom(0, w));
            step = CommonHelper.getRandom(downB, topB);
        }
        //image.noise(1);
        AsyncHelper.waterfall([
            cb => image.setFormat('jpg').quality(this.quality).toBuffer(cb),
            buffer => this.controller.sendData(buffer, "binary")
        ], cb);
    }

    drawText (image, x, y, text, angle) {
        image.draw('skewX', angle, 'text', `${x},${y}`, `"${text}"`);
    }
};

const gm = require('gm');
const path = require('path');
const AsyncHelper = require('../helper/AsyncHelper');
const CommonHelper = require('../helper/CommonHelper');