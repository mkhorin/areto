/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Action');

module.exports = class Captcha extends Base {

    constructor (config) {
        super({
            'minLength': 5,
            'maxLength': 5,
            'width': 180,
            'height': 60,
            'background': '#ffffff',
            'foreground': '#666666',
            'offset': -2,
            'symbolPool': '0123456789',
            'fixedVerifyCode': null,
            'quality': 10,
            'fontFamily': '',
            'drawWidth': 300,
            'drawHeight': 100,
            'grid': true,
            'median': 2,
            ...config
        });
    }

    async execute () {
        let buffer = await this.render(this.getVerifyCode(true));
        this.controller.sendData(buffer, 'binary');
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

    async render (code) {
        return this.draw(code).jpeg({'quality': this.quality}).toBuffer();
    }

    draw (code) {
        let data = {};
        let cell = Math.round(this.drawWidth / code.length);
        let posX = Math.round(cell / 2);
        let posY = Math.round(this.drawHeight / 2);
        let offsetX = Math.round(cell / 3);
        let offsetY = Math.round(this.drawHeight / 2);
        data.fill = this.foreground;
        let content = '';
        for (let i = 0; i < code.length; ++i) {
            data.text = code[i];
            data.size = CommonHelper.getRandom(30, 65);
            data.x = posX + CommonHelper.getRandom(-offsetX, offsetX);
            data.y = posY + CommonHelper.getRandom(data.size - offsetY, data.size);
            data.angle = CommonHelper.getRandom(-30, 30);
            content += this.drawLetter(data);
            posX += cell;
        }
        if (this.grid) {
            content += this.drawGrid();
        }
        let image = sharp(new Buffer(this.drawBack(content)));
        if (this.median) {
            image.median(this.median);
        }
        return image;
    }

    drawLetter ({text, x, y, size, angle, fill}) {
        return `<text x="${x}" y="${y}" transform="rotate(${angle} ${x} ${y})" font-family="${this.fontFamily}" text-anchor="middle" dominant-baseline="central" font-size="${size}" fill="${fill}">${text}</text>`;
    }

    drawGrid () {
        let width = this.drawWidth;
        let height = this.drawHeight;
        let a = 20, b = 40, step;
        let content= '';
        for (let x = 0; x < width; x += CommonHelper.getRandom(a, b)) {
            content += this.drawLine(CommonHelper.getRandom(0, width), 0, CommonHelper.getRandom(0, width), height);
        }
        for (let y = 0; y < height; y += CommonHelper.getRandom(a, b)) {
            content += this.drawLine(0, CommonHelper.getRandom(0, height), width, CommonHelper.getRandom(0, width));
        }
        return content;
    }

    drawLine (x1, y1, x2, y2) {
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${this.foreground}"/>`;
    }

    drawBack (content) {
        return `<svg width="${this.width}" height="${this.height}" viewBox="0 0 ${this.drawWidth} ${this.drawHeight}">
            <rect width="100%" height="100%" fill="${this.background}"/>${content}</svg>`;
    }
};

const path = require('path');
const sharp = require('sharp');
const CommonHelper = require('../helper/CommonHelper');