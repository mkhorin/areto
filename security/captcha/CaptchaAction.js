/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../base/Action');

module.exports = class Captcha extends Base {

    constructor (config) {
        super({
            minLength: 5,
            maxLength: 5,
            width: 180,
            height: 60,
            backColor: '#ffffff',
            textColor: '#666666',
            symbolPool: '0123456789',
            fixedVerifyCode: null,
            quality: 10,
            fontFamily: 'Serif', // Serif Mono Sans
            textSizeMin: 30,
            textSizeMax: 65,
            textAngleMin: -30,
            textAngleMax: 30,
            drawWidth: 300,
            drawHeight: 100,
            grid: true,
            gridColors: ['#ffffff', '#666666'],
            gridLineWidth: 2,
            median: 0,
            ...config
        });
    }

    async execute () {
        const buffer = await this.render(this.getVerifyCode(true));
        this.controller.sendData(buffer, 'binary');
    }

    validate (value) {
        return value.toLowerCase() === this.getVerifyCode();
    }

    getVerifyCode (renew) {
        if (this.fixedVerifyCode !== null) {
            return this.fixedVerifyCode;
        }
        const {session} = this.controller.req;
        const name = this.getSessionKey();
        if (!session[name] || renew) {
            session[name] = this.generateVerifyCode();
        }
        return session[name];
    }

    getSessionKey () {
        return `__captcha/${this.getFullName()}`;
    }

    generateVerifyCode () {
        const length = random(this.minLength, this.maxLength);
        const buffer = [];
        for (let i = 0; i < length; ++i) {
            let index = random(0, this.symbolPool.length - 1);
            buffer.push(this.symbolPool[index]);
        }
        return buffer.join('');
    }

    render (code) {
        return this.draw(code).jpeg({quality: this.quality}).toBuffer();
    }

    draw (code) {
        let content = this.drawText(code);
        if (this.grid) {
            content += this.drawGrid();
        }
        const sharp = require('sharp');
        const result = this.drawBack(content);
        const buffer = new Buffer(result);
        const image = sharp(buffer);
        if (this.median) {
            image.median(this.median);
        }
        return image;
    }

    drawText (text) {
        let data = {color: this.textColor};
        let cell = Math.round(this.drawWidth / text.length);
        let posX = Math.round(cell / 2);
        let posY = Math.round(this.drawHeight / 2);
        let offsetX = Math.round(cell / 3);
        let offsetY = Math.round(this.drawHeight / 2);
        let content = '';
        for (let i = 0; i < text.length; ++i) {
            data.text = text[i];
            data.size = random(this.textSizeMin, this.textSizeMax);
            data.x = posX + random(-offsetX, offsetX);
            data.y = posY + random(data.size - offsetY, data.size);
            data.angle = random(this.textAngleMin, this.textAngleMax);
            content += this.drawLetter(data);
            posX += cell;
        }
        return content;
    }

    drawLetter ({text, x, y, size, angle, color}) {
        return `<text x="${x}" y="${y}" transform="rotate(${angle} ${x} ${y})" 
            font-family="${this.fontFamily}" text-anchor="middle" dominant-baseline="central" 
            font-size="${size}" fill="${color}">${text}</text>`;
    }

    drawGrid () {
        let w = this.drawWidth, h = this.drawHeight;
        let a = 20, b = 40, color, content= '';
        for (let x = 0; x < w; x += random(a, b)) {
            color = this.gridColors[random(0, this.gridColors.length - 1)];
            content += this.drawLine(random(0, w), 0, random(0, w), h, color);
        }
        for (let y = 0; y < h; y += random(a, b)) {
            color = this.gridColors[random(0, this.gridColors.length - 1)];
            content += this.drawLine(0, random(0, h), w, random(0, w), color);
        }
        return content;
    }

    drawLine (x1, y1, x2, y2, color) {
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
          stroke="${color}" stroke-width="${this.gridLineWidth}"/>`;
    }

    drawBack (content) {
        return `<svg width="${this.width}" height="${this.height}" 
          viewBox="0 0 ${this.drawWidth} ${this.drawHeight}"><rect width="100%" height="100%" 
          fill="${this.backColor}"/>${content}</svg>`;
    }
};

const {random} = require('../../helper/MathHelper');