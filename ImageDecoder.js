/*
    
    Pure JavaScript library for decoding images
    
    Has full support for PNG, JPEG, QOI, and partial support for BMP
    
    Credits / Copyrights:
        https://github.com/jpeg-js/jpeg-js
        https://github.com/devongovett/png.js/
        https://github.com/kchapelier/qoijs
        https://www.khanacademy.org/computer-programming/i/4617122376548352
        https://www.khanacademy.org/computer-programming/i/5509538030075904
        
    Usage:
        There exists global variables:
            PNG, JPEG, QOI, and BMP
        
        they all work like so:
            var myImage = new PNG(base64Data);
        
        however having the raw image object is next to useless so each image has a .toImageData() method
            var myImageData = myImage.toImageData();
            
        the imageData can then be drawn using:
            ctx.putImageData(myImageData, x, y);
            
        the library also provides you with a function to convert the ImageData to an Image object
            var myBrowserImage = ImageDataToImage(myImageData);
            ctx.drawImage(myBrowserImage, x, y, w*, h*);
            
        if you don't know the mime type of the base64 image you can use the createImage() function which tries to find the mime type of the image. If it finds the mime type it will return an image of that type, otherwise it will return null
    
*/

var ImageUtils = {
    asciiToBinary: function(text) {
        /* Convert an ASCII base64 string into binary data. */
        var s = text.split(",");
        text = s[s.length - 1]; /* strip away header */

        var digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
            a, b, c, x, y,
            result = [];
        for (var i = 0; i < text.length; result.push(a, b, c)) {
            x = digits.indexOf(text[i++]);
            y = digits.indexOf(text[i++]);
            a = x << 2 | y >> 4;
            x = digits.indexOf(text[i++]);
            b = (y & 0x0f) << 4 | x >> 2;
            y = digits.indexOf(text[i++]);
            c = (x & 3) << 6 | y;
        }

        return result;
    },
    newUintArray: function(a) {
        if (typeof a === "number") {
            return new Array(a);
        } else {
            return a.slice();
        }
    },
    JpegImageDecoder: (function() {
        var dctZigZag = new Int32Array([
            0,
            1, 8,
            16, 9, 2,
            3, 10, 17, 24,
            32, 25, 18, 11, 4,
            5, 12, 19, 26, 33, 40,
            48, 41, 34, 27, 20, 13, 6,
            7, 14, 21, 28, 35, 42, 49, 56,
            57, 50, 43, 36, 29, 22, 15,
            23, 30, 37, 44, 51, 58,
            59, 52, 45, 38, 31,
            39, 46, 53, 60,
            61, 54, 47,
            55, 62,
            63
        ]);

        var dctCos1 = 4017; // cos(pi/16)
        var dctSin1 = 799; // sin(pi/16)
        var dctCos3 = 3406; // cos(3*pi/16)
        var dctSin3 = 2276; // sin(3*pi/16)
        var dctCos6 = 1567; // cos(6*pi/16)
        var dctSin6 = 3784; // sin(6*pi/16)
        var dctSqrt2 = 5793; // sqrt(2)
        var dctSqrt1d2 = 2896; // sqrt(2) / 2

        var constructor = function() {};

        function buildHuffmanTable(codeLengths, values) {
            var k = 0,
                code = [],
                i, j, length = 16;
            while (length > 0 && !codeLengths[length - 1]) {
                length--;
            }
            code.push({
                children: [],
                index: 0
            });
            var p = code[0],
                q;
            for (i = 0; i < length; i++) {
                for (j = 0; j < codeLengths[i]; j++) {
                    p = code.pop();
                    p.children[p.index] = values[k];
                    while (p.index > 0) {
                        if (code.length === 0) {
                            println('Could not recreate Huffman Table');
                        }
                        p = code.pop();
                    }
                    p.index++;
                    code.push(p);
                    while (code.length <= i) {
                        code.push(q = {
                            children: [],
                            index: 0
                        });
                        p.children[p.index] = q.children;
                        p = q;
                    }
                    k++;
                }
                if (i + 1 < length) {
                    // p here points to last code
                    q = {
                        children: [],
                        index: 0
                    };
                    code.push(q);
                    p.children[p.index] = q.children;
                    p = q;
                }
            }
            return code[0].children;
        }

        function decodeScan(data, offset,
            frame, components, resetInterval,
            spectralStart, spectralEnd,
            successivePrev, successive, opts) {
            var precision = frame.precision;
            var samplesPerLine = frame.samplesPerLine;
            var scanLines = frame.scanLines;
            var mcusPerLine = frame.mcusPerLine;
            var progressive = frame.progressive;
            var maxH = frame.maxH,
                maxV = frame.maxV;

            var startOffset = offset,
                bitsData = 0,
                bitsCount = 0;

            function readBit() {
                if (bitsCount > 0) {
                    bitsCount--;
                    return (bitsData >> bitsCount) & 1;
                }
                bitsData = data[offset];
                offset++;
                if (bitsData === 0xFF) {
                    var nextByte = data[offset];
                    offset++;
                    if (nextByte) {
                        println("unexpected marker: " + ((bitsData << 8) | nextByte).toString(16));
                    }
                    // unstuff 0
                }
                bitsCount = 7;
                return bitsData >>> 7;
            }

            function decodeHuffman(tree) {
                var node = tree,
                    bit;
                while ((bit = readBit()) !== null) {
                    node = node[bit];
                    if (typeof node === 'number') {
                        return node;
                    }
                    if (typeof node !== 'object') {
                        println("invalid huffman sequence");
                    }
                }
                return null;
            }

            function receive(length) {
                var n = 0;
                while (length > 0) {
                    var bit = readBit();
                    if (bit === null) {
                        return;
                    }
                    n = (n << 1) | bit;
                    length--;
                }
                return n;
            }

            function receiveAndExtend(length) {
                var n = receive(length);
                if (n >= 1 << (length - 1)) {
                    return n;
                }
                return n + (-1 << length) + 1;
            }

            function decodeBaseline(component, zz) {
                var t = decodeHuffman(component.huffmanTableDC);
                var diff = t === 0 ? 0 : receiveAndExtend(t);
                component.pred += diff;
                zz[0] = component.pred;
                var k = 1;
                while (k < 64) {
                    var rs = decodeHuffman(component.huffmanTableAC);
                    var s = rs & 15,
                        r = rs >> 4;
                    if (s === 0) {
                        if (r < 15) {
                            break;
                        }
                        k += 16;
                        continue;
                    }
                    k += r;
                    var z = dctZigZag[k];
                    zz[z] = receiveAndExtend(s);
                    k++;
                }
            }

            function decodeDCFirst(component, zz) {
                var t = decodeHuffman(component.huffmanTableDC);
                var diff = t === 0 ? 0 : (receiveAndExtend(t) << successive);
                component.pred += diff;
                zz[0] = component.pred;
            }

            function decodeDCSuccessive(component, zz) {
                zz[0] |= readBit() << successive;
            }
            var eobrun = 0;

            function decodeACFirst(component, zz) {
                if (eobrun > 0) {
                    eobrun--;
                    return;
                }
                var k = spectralStart,
                    e = spectralEnd;
                while (k <= e) {
                    var rs = decodeHuffman(component.huffmanTableAC);
                    var s = rs & 15,
                        r = rs >> 4;
                    if (s === 0) {
                        if (r < 15) {
                            eobrun = receive(r) + (1 << r) - 1;
                            break;
                        }
                        k += 16;
                        continue;
                    }
                    k += r;
                    var z = dctZigZag[k];
                    zz[z] = receiveAndExtend(s) * (1 << successive);
                    k++;
                }
            }
            var successiveACState = 0,
                successiveACNextValue;

            function decodeACSuccessive(component, zz) {
                var k = spectralStart,
                    e = spectralEnd,
                    r = 0;
                while (k <= e) {
                    var z = dctZigZag[k];
                    var direction = zz[z] < 0 ? -1 : 1;
                    switch (successiveACState) {
                        case 0: // initial state
                            var rs = decodeHuffman(component.huffmanTableAC);
                            var s = rs & 15,
                                r = rs >> 4;
                            if (s === 0) {
                                if (r < 15) {
                                    eobrun = receive(r) + (1 << r);
                                    successiveACState = 4;
                                } else {
                                    r = 16;
                                    successiveACState = 1;
                                }
                            } else {
                                if (s !== 1) {
                                    println("invalid ACn encoding");
                                }
                                successiveACNextValue = receiveAndExtend(s);
                                successiveACState = r ? 2 : 3;
                            }
                            continue;
                        case 1: // skipping r zero items
                        case 2:
                            if (zz[z]) {
                                zz[z] += (readBit() << successive) * direction;
                            } else {
                                r--;
                                if (r === 0) {
                                    successiveACState = successiveACState === 2 ? 3 : 0;
                                }
                            }
                            break;
                        case 3: // set value for a zero item
                            if (zz[z]) {
                                zz[z] += (readBit() << successive) * direction;
                            } else {
                                zz[z] = successiveACNextValue << successive;
                                successiveACState = 0;
                            }
                            break;
                        case 4: // eob
                            if (zz[z]) {
                                zz[z] += (readBit() << successive) * direction;
                            }
                            break;
                    }
                    k++;
                }
                if (successiveACState === 4) {
                    eobrun--;
                    if (eobrun === 0) {
                        successiveACState = 0;
                    }
                }
            }

            function decodeMcu(component, decode, mcu, row, col) {
                var mcuRow = (mcu / mcusPerLine) | 0;
                var mcuCol = mcu % mcusPerLine;
                var blockRow = mcuRow * component.v + row;
                var blockCol = mcuCol * component.h + col;
                // If the block is missing and we're in tolerant mode, just skip it.
                if (component.blocks[blockRow] === undefined && opts.tolerantDecoding) {
                    return;
                }
                decode(component, component.blocks[blockRow][blockCol]);
            }

            function decodeBlock(component, decode, mcu) {
                var blockRow = (mcu / component.blocksPerLine) | 0;
                var blockCol = mcu % component.blocksPerLine;
                // If the block is missing and we're in tolerant mode, just skip it.
                if (component.blocks[blockRow] === undefined && opts.tolerantDecoding) {
                    return;
                }
                decode(component, component.blocks[blockRow][blockCol]);
            }

            var componentsLength = components.length;
            var component, i, j, k, n;
            var decodeFn;
            if (progressive) {
                if (spectralStart === 0) {
                    decodeFn = successivePrev === 0 ? decodeDCFirst : decodeDCSuccessive;
                } else {
                    decodeFn = successivePrev === 0 ? decodeACFirst : decodeACSuccessive;
                }
            } else {
                decodeFn = decodeBaseline;
            }

            var mcu = 0,
                marker;
            var mcuExpected;
            if (componentsLength === 1) {
                mcuExpected = components[0].blocksPerLine * components[0].blocksPerColumn;
            } else {
                mcuExpected = mcusPerLine * frame.mcusPerColumn;
            }
            if (!resetInterval) {
                resetInterval = mcuExpected;
            }

            var h, v;
            while (mcu < mcuExpected) {
                // reset interval stuff
                for (i = 0; i < componentsLength; i++) {
                    components[i].pred = 0;
                }
                eobrun = 0;

                if (componentsLength === 1) {
                    component = components[0];
                    for (n = 0; n < resetInterval; n++) {
                        decodeBlock(component, decodeFn, mcu);
                        mcu++;
                    }
                } else {
                    for (n = 0; n < resetInterval; n++) {
                        for (i = 0; i < componentsLength; i++) {
                            component = components[i];
                            h = component.h;
                            v = component.v;
                            for (j = 0; j < v; j++) {
                                for (k = 0; k < h; k++) {
                                    decodeMcu(component, decodeFn, mcu, j, k);
                                }
                            }
                        }
                        mcu++;

                        // If we've reached our expected MCU's, stop decoding
                        if (mcu === mcuExpected) {
                            break;
                        }
                    }
                }

                if (mcu === mcuExpected) {
                    // Skip trailing bytes at the end of the scan - until we reach the next marker
                    do {
                        if (data[offset] === 0xFF) {
                            if (data[offset + 1] !== 0x00) {
                                break;
                            }
                        }
                        offset += 1;
                    } while (offset < data.length - 2);
                }

                // find marker
                bitsCount = 0;
                marker = (data[offset] << 8) | data[offset + 1];
                if (marker < 0xFF00) {
                    println("marker was not found");
                }

                if (marker >= 0xFFD0 && marker <= 0xFFD7) { // RSTx
                    offset += 2;
                } else {
                    break;
                }
            }

            return offset - startOffset;
        }

        function buildComponentData(frame, component) {
            var lines = [];
            var blocksPerLine = component.blocksPerLine;
            var blocksPerColumn = component.blocksPerColumn;
            var samplesPerLine = blocksPerLine << 3;
            // Only 1 used per invocation of this function and garbage collected after invocation, so no need to account for its memory footprint.
            var R = new Int32Array(64),
                r = new Uint8Array(64);

            // A port of poppler's IDCT method which in turn is taken from:
            //   Christoph Loeffler, Adriaan Ligtenberg, George S. Moschytz,
            //   "Practical Fast 1-D DCT Algorithms with 11 Multiplications",
            //   IEEE Intl. Conf. on Acoustics, Speech & Signal Processing, 1989,
            //   988-991.
            function quantizeAndInverse(zz, dataOut, dataIn) {
                var qt = component.quantizationTable;
                var v0, v1, v2, v3, v4, v5, v6, v7, t;
                var p = dataIn;
                var i;

                // dequant
                for (i = 0; i < 64; i++) {
                    p[i] = zz[i] * qt[i];
                }

                // inverse DCT on rows
                for (i = 0; i < 8; ++i) {
                    var row = 8 * i;

                    // check for all-zero AC coefficients
                    if (p[1 + row] === 0 && p[2 + row] === 0 && p[3 + row] === 0 &&
                        p[4 + row] === 0 && p[5 + row] === 0 && p[6 + row] === 0 &&
                        p[7 + row] === 0) {
                        t = (dctSqrt2 * p[0 + row] + 512) >> 10;
                        p[0 + row] = t;
                        p[1 + row] = t;
                        p[2 + row] = t;
                        p[3 + row] = t;
                        p[4 + row] = t;
                        p[5 + row] = t;
                        p[6 + row] = t;
                        p[7 + row] = t;
                        continue;
                    }

                    // stage 4
                    v0 = (dctSqrt2 * p[0 + row] + 128) >> 8;
                    v1 = (dctSqrt2 * p[4 + row] + 128) >> 8;
                    v2 = p[2 + row];
                    v3 = p[6 + row];
                    v4 = (dctSqrt1d2 * (p[1 + row] - p[7 + row]) + 128) >> 8;
                    v7 = (dctSqrt1d2 * (p[1 + row] + p[7 + row]) + 128) >> 8;
                    v5 = p[3 + row] << 4;
                    v6 = p[5 + row] << 4;

                    // stage 3
                    t = (v0 - v1 + 1) >> 1;
                    v0 = (v0 + v1 + 1) >> 1;
                    v1 = t;
                    t = (v2 * dctSin6 + v3 * dctCos6 + 128) >> 8;
                    v2 = (v2 * dctCos6 - v3 * dctSin6 + 128) >> 8;
                    v3 = t;
                    t = (v4 - v6 + 1) >> 1;
                    v4 = (v4 + v6 + 1) >> 1;
                    v6 = t;
                    t = (v7 + v5 + 1) >> 1;
                    v5 = (v7 - v5 + 1) >> 1;
                    v7 = t;

                    // stage 2
                    t = (v0 - v3 + 1) >> 1;
                    v0 = (v0 + v3 + 1) >> 1;
                    v3 = t;
                    t = (v1 - v2 + 1) >> 1;
                    v1 = (v1 + v2 + 1) >> 1;
                    v2 = t;
                    t = (v4 * dctSin3 + v7 * dctCos3 + 2048) >> 12;
                    v4 = (v4 * dctCos3 - v7 * dctSin3 + 2048) >> 12;
                    v7 = t;
                    t = (v5 * dctSin1 + v6 * dctCos1 + 2048) >> 12;
                    v5 = (v5 * dctCos1 - v6 * dctSin1 + 2048) >> 12;
                    v6 = t;

                    // stage 1
                    p[0 + row] = v0 + v7;
                    p[7 + row] = v0 - v7;
                    p[1 + row] = v1 + v6;
                    p[6 + row] = v1 - v6;
                    p[2 + row] = v2 + v5;
                    p[5 + row] = v2 - v5;
                    p[3 + row] = v3 + v4;
                    p[4 + row] = v3 - v4;
                }

                // inverse DCT on columns
                for (i = 0; i < 8; ++i) {
                    var col = i;

                    // check for all-zero AC coefficients
                    if (p[1 * 8 + col] === 0 && p[2 * 8 + col] === 0 && p[3 * 8 + col] === 0 &&
                        p[4 * 8 + col] === 0 && p[5 * 8 + col] === 0 && p[6 * 8 + col] === 0 &&
                        p[7 * 8 + col] === 0) {
                        t = (dctSqrt2 * dataIn[i + 0] + 8192) >> 14;
                        p[0 * 8 + col] = t;
                        p[1 * 8 + col] = t;
                        p[2 * 8 + col] = t;
                        p[3 * 8 + col] = t;
                        p[4 * 8 + col] = t;
                        p[5 * 8 + col] = t;
                        p[6 * 8 + col] = t;
                        p[7 * 8 + col] = t;
                        continue;
                    }

                    // stage 4
                    v0 = (dctSqrt2 * p[0 * 8 + col] + 2048) >> 12;
                    v1 = (dctSqrt2 * p[4 * 8 + col] + 2048) >> 12;
                    v2 = p[2 * 8 + col];
                    v3 = p[6 * 8 + col];
                    v4 = (dctSqrt1d2 * (p[1 * 8 + col] - p[7 * 8 + col]) + 2048) >> 12;
                    v7 = (dctSqrt1d2 * (p[1 * 8 + col] + p[7 * 8 + col]) + 2048) >> 12;
                    v5 = p[3 * 8 + col];
                    v6 = p[5 * 8 + col];

                    // stage 3
                    t = (v0 - v1 + 1) >> 1;
                    v0 = (v0 + v1 + 1) >> 1;
                    v1 = t;
                    t = (v2 * dctSin6 + v3 * dctCos6 + 2048) >> 12;
                    v2 = (v2 * dctCos6 - v3 * dctSin6 + 2048) >> 12;
                    v3 = t;
                    t = (v4 - v6 + 1) >> 1;
                    v4 = (v4 + v6 + 1) >> 1;
                    v6 = t;
                    t = (v7 + v5 + 1) >> 1;
                    v5 = (v7 - v5 + 1) >> 1;
                    v7 = t;

                    // stage 2
                    t = (v0 - v3 + 1) >> 1;
                    v0 = (v0 + v3 + 1) >> 1;
                    v3 = t;
                    t = (v1 - v2 + 1) >> 1;
                    v1 = (v1 + v2 + 1) >> 1;
                    v2 = t;
                    t = (v4 * dctSin3 + v7 * dctCos3 + 2048) >> 12;
                    v4 = (v4 * dctCos3 - v7 * dctSin3 + 2048) >> 12;
                    v7 = t;
                    t = (v5 * dctSin1 + v6 * dctCos1 + 2048) >> 12;
                    v5 = (v5 * dctCos1 - v6 * dctSin1 + 2048) >> 12;
                    v6 = t;

                    // stage 1
                    p[0 * 8 + col] = v0 + v7;
                    p[7 * 8 + col] = v0 - v7;
                    p[1 * 8 + col] = v1 + v6;
                    p[6 * 8 + col] = v1 - v6;
                    p[2 * 8 + col] = v2 + v5;
                    p[5 * 8 + col] = v2 - v5;
                    p[3 * 8 + col] = v3 + v4;
                    p[4 * 8 + col] = v3 - v4;
                }

                // convert to 8-bit integers
                for (i = 0; i < 64; ++i) {
                    var sample = 128 + ((p[i] + 8) >> 4);
                    dataOut[i] = sample < 0 ? 0 : (sample > 0xFF ? 0xFF : sample);
                }
            }

            requestMemoryAllocation(samplesPerLine * blocksPerColumn * 8);

            var i, j;
            for (var blockRow = 0; blockRow < blocksPerColumn; blockRow++) {
                var scanLine = blockRow << 3;
                for (i = 0; i < 8; i++) {
                    lines.push(new Uint8Array(samplesPerLine));
                }
                for (var blockCol = 0; blockCol < blocksPerLine; blockCol++) {
                    quantizeAndInverse(component.blocks[blockRow][blockCol], r, R);

                    var offset = 0,
                        sample = blockCol << 3;
                    for (j = 0; j < 8; j++) {
                        var line = lines[scanLine + j];
                        for (i = 0; i < 8; i++) {
                            line[sample + i] = r[offset];
                            offset++;
                        }
                    }
                }
            }
            return lines;
        }

        function clampTo8bit(a) {
            return a < 0 ? 0 : (a > 255 ? 255 : a);
        }

        constructor.prototype = {
            parse: function parse(data) {
                var maxResolutionInPixels = this.opts.maxResolutionInMP * 1000 * 1000;
                var offset = 0,
                    length = data.length;

                function readUint16() {
                    var value = (data[offset] << 8) | data[offset + 1];
                    offset += 2;
                    return value;
                }

                function readDataBlock() {
                    var length = readUint16();
                    var array = data.subarray(offset, offset + length - 2);
                    offset += array.length;
                    return array;
                }

                function prepareComponents(frame) {
                    var maxH = 0,
                        maxV = 0;
                    var component, componentId;
                    for (componentId in frame.components) {
                        if (frame.components.hasOwnProperty(componentId)) {
                            component = frame.components[componentId];
                            if (maxH < component.h) {
                                maxH = component.h;
                            }
                            if (maxV < component.v) {
                                maxV = component.v;
                            }
                        }
                    }
                    var mcusPerLine = Math.ceil(frame.samplesPerLine / 8 / maxH);
                    var mcusPerColumn = Math.ceil(frame.scanLines / 8 / maxV);
                    for (componentId in frame.components) {
                        if (frame.components.hasOwnProperty(componentId)) {
                            component = frame.components[componentId];
                            var blocksPerLine = Math.ceil(Math.ceil(frame.samplesPerLine / 8) * component.h / maxH);
                            var blocksPerColumn = Math.ceil(Math.ceil(frame.scanLines / 8) * component.v / maxV);
                            var blocksPerLineForMcu = mcusPerLine * component.h;
                            var blocksPerColumnForMcu = mcusPerColumn * component.v;
                            var blocksToAllocate = blocksPerColumnForMcu * blocksPerLineForMcu;
                            var blocks = [];

                            // Each block is a Int32Array of length 64 (4 x 64 = 256 bytes)
                            requestMemoryAllocation(blocksToAllocate * 256);

                            for (var i = 0; i < blocksPerColumnForMcu; i++) {
                                var row = [];
                                for (var j = 0; j < blocksPerLineForMcu; j++) {
                                    row.push(new Int32Array(64));
                                }
                                blocks.push(row);
                            }
                            component.blocksPerLine = blocksPerLine;
                            component.blocksPerColumn = blocksPerColumn;
                            component.blocks = blocks;
                        }
                    }
                    frame.maxH = maxH;
                    frame.maxV = maxV;
                    frame.mcusPerLine = mcusPerLine;
                    frame.mcusPerColumn = mcusPerColumn;
                }
                var jfif = null;
                var adobe = null;
                var pixels = null;
                var frame, resetInterval;
                var quantizationTables = [],
                    frames = [];
                var huffmanTablesAC = [],
                    huffmanTablesDC = [];
                var fileMarker = readUint16();
                var malformedDataOffset = -1;
                this.comments = [];
                if (fileMarker !== 0xFFD8) { // SOI (Start of Image)
                    println("SOI not found");
                }

                fileMarker = readUint16();
                while (fileMarker !== 0xFFD9) { // EOI (End of image)
                    var i, j, l;
                    switch (fileMarker) {
                        case 0xFF00:
                            break;
                        case 0xFFE0: // APP0 (Application Specific)
                        case 0xFFE1: // APP1
                        case 0xFFE2: // APP2
                        case 0xFFE3: // APP3
                        case 0xFFE4: // APP4
                        case 0xFFE5: // APP5
                        case 0xFFE6: // APP6
                        case 0xFFE7: // APP7
                        case 0xFFE8: // APP8
                        case 0xFFE9: // APP9
                        case 0xFFEA: // APP10
                        case 0xFFEB: // APP11
                        case 0xFFEC: // APP12
                        case 0xFFED: // APP13
                        case 0xFFEE: // APP14
                        case 0xFFEF: // APP15
                        case 0xFFFE: // COM (Comment)
                            var appData = readDataBlock();

                            if (fileMarker === 0xFFFE) {
                                var comment = String.fromCharCode.apply(null, appData);
                                this.comments.push(comment);
                            }

                            if (fileMarker === 0xFFE0) {
                                if (appData[0] === 0x4A && appData[1] === 0x46 && appData[2] === 0x49 &&
                                    appData[3] === 0x46 && appData[4] === 0) { // 'JFIF\x00'
                                    jfif = {
                                        version: {
                                            major: appData[5],
                                            minor: appData[6]
                                        },
                                        densityUnits: appData[7],
                                        xDensity: (appData[8] << 8) | appData[9],
                                        yDensity: (appData[10] << 8) | appData[11],
                                        thumbWidth: appData[12],
                                        thumbHeight: appData[13],
                                        thumbData: appData.subarray(14, 14 + 3 * appData[12] * appData[13])
                                    };
                                }
                            }
                            // TODO APP1 - Exif
                            if (fileMarker === 0xFFE1) {
                                if (appData[0] === 0x45 &&
                                    appData[1] === 0x78 &&
                                    appData[2] === 0x69 &&
                                    appData[3] === 0x66 &&
                                    appData[4] === 0) { // 'EXIF\x00'
                                    this.exifBuffer = appData.subarray(5, appData.length);
                                }
                            }

                            if (fileMarker === 0xFFEE) {
                                if (appData[0] === 0x41 && appData[1] === 0x64 && appData[2] === 0x6F &&
                                    appData[3] === 0x62 && appData[4] === 0x65 && appData[5] === 0) { // 'Adobe\x00'
                                    adobe = {
                                        version: appData[6],
                                        flags0: (appData[7] << 8) | appData[8],
                                        flags1: (appData[9] << 8) | appData[10],
                                        transformCode: appData[11]
                                    };
                                }
                            }
                            break;

                        case 0xFFDB: // DQT (Define Quantization Tables)
                            var quantizationTablesLength = readUint16();
                            var quantizationTablesEnd = quantizationTablesLength + offset - 2;
                            while (offset < quantizationTablesEnd) {
                                var quantizationTableSpec = data[offset++];
                                requestMemoryAllocation(64 * 4);
                                var tableData = new Int32Array(64);
                                if ((quantizationTableSpec >> 4) === 0) { // 8 bit values
                                    for (j = 0; j < 64; j++) {
                                        var z = dctZigZag[j];
                                        tableData[z] = data[offset++];
                                    }
                                } else if ((quantizationTableSpec >> 4) === 1) { //16 bit
                                    for (j = 0; j < 64; j++) {
                                        var z = dctZigZag[j];
                                        tableData[z] = readUint16();
                                    }
                                } else {
                                    println("DQT: invalid table spec");
                                }
                                quantizationTables[quantizationTableSpec & 15] = tableData;
                            }
                            break;

                        case 0xFFC0: // SOF0 (Start of Frame, Baseline DCT)
                        case 0xFFC1: // SOF1 (Start of Frame, Extended DCT)
                        case 0xFFC2: // SOF2 (Start of Frame, Progressive DCT)
                            readUint16(); // skip data length
                            frame = {};
                            frame.extended = (fileMarker === 0xFFC1);
                            frame.progressive = (fileMarker === 0xFFC2);
                            frame.precision = data[offset++];
                            frame.scanLines = readUint16();
                            frame.samplesPerLine = readUint16();
                            frame.components = {};
                            frame.componentsOrder = [];

                            var pixelsInFrame = frame.scanLines * frame.samplesPerLine;
                            if (pixelsInFrame > maxResolutionInPixels) {
                                var exceededAmount = Math.ceil((pixelsInFrame - maxResolutionInPixels) / 1e6);
                                println("maxResolutionInMP limit exceeded by ${exceededAmount}MP");
                            }

                            var componentsCount = data[offset++],
                                componentId;
                            var maxH = 0,
                                maxV = 0;
                            for (i = 0; i < componentsCount; i++) {
                                componentId = data[offset];
                                var h = data[offset + 1] >> 4;
                                var v = data[offset + 1] & 15;
                                var qId = data[offset + 2];
                                frame.componentsOrder.push(componentId);
                                frame.components[componentId] = {
                                    h: h,
                                    v: v,
                                    quantizationIdx: qId
                                };
                                offset += 3;
                            }
                            prepareComponents(frame);
                            frames.push(frame);
                            break;

                        case 0xFFC4: // DHT (Define Huffman Tables)
                            var huffmanLength = readUint16();
                            for (i = 2; i < huffmanLength;) {
                                var huffmanTableSpec = data[offset++];
                                var codeLengths = new Uint8Array(16);
                                var codeLengthSum = 0;
                                for (j = 0; j < 16; j++, offset++) {
                                    codeLengthSum += (codeLengths[j] = data[offset]);
                                }
                                requestMemoryAllocation(16 + codeLengthSum);
                                var huffmanValues = new Uint8Array(codeLengthSum);
                                for (j = 0; j < codeLengthSum; j++, offset++) {
                                    huffmanValues[j] = data[offset];
                                }
                                i += 17 + codeLengthSum;

                                ((huffmanTableSpec >> 4) === 0 ?
                                    huffmanTablesDC : huffmanTablesAC)[huffmanTableSpec & 15] = buildHuffmanTable(codeLengths, huffmanValues);
                            }
                            break;

                        case 0xFFDD: // DRI (Define Restart Interval)
                            readUint16(); // skip data length
                            resetInterval = readUint16();
                            break;

                        case 0xFFDC: // Number of Lines marker
                            readUint16(); // skip data length
                            readUint16(); // Ignore this data since it represents the image height
                            break;

                        case 0xFFDA: // SOS (Start of Scan)
                            var scanLength = readUint16();
                            var selectorsCount = data[offset++];
                            var components = [],
                                component;
                            for (i = 0; i < selectorsCount; i++) {
                                component = frame.components[data[offset++]];
                                var tableSpec = data[offset++];
                                component.huffmanTableDC = huffmanTablesDC[tableSpec >> 4];
                                component.huffmanTableAC = huffmanTablesAC[tableSpec & 15];
                                components.push(component);
                            }
                            var spectralStart = data[offset++];
                            var spectralEnd = data[offset++];
                            var successiveApproximation = data[offset++];
                            var processed = decodeScan(data, offset,
                                frame, components, resetInterval,
                                spectralStart, spectralEnd,
                                successiveApproximation >> 4, successiveApproximation & 15, this.opts);
                            offset += processed;
                            break;

                        case 0xFFFF: // Fill bytes
                            if (data[offset] !== 0xFF) { // Avoid skipping a valid marker.
                                offset--;
                            }
                            break;
                        default:
                            if (data[offset - 3] === 0xFF &&
                                data[offset - 2] >= 0xC0 && data[offset - 2] <= 0xFE) {
                                // could be incorrect encoding -- last 0xFF byte of the previous
                                // block was eaten by the encoder
                                offset -= 3;
                                break;
                            } else if (fileMarker === 0xE0 || fileMarker === 0xE1) {
                                // Recover from malformed APP1 markers popular in some phone models.
                                // See https://github.com/eugeneware/jpeg-js/issues/82
                                if (malformedDataOffset !== -1) {
                                    println("first unknown JPEG marker at offset ${malformedDataOffset.toString(16)}, second unknown JPEG marker ${fileMarker.toString(16)} at offset ${(offset - 1).toString(16)}");
                                }
                                malformedDataOffset = offset - 1;
                                var nextOffset = readUint16();
                                if (data[offset + nextOffset - 2] === 0xFF) {
                                    offset += nextOffset - 2;
                                    break;
                                }
                            }
                            println("unknown JPEG marker " + fileMarker.toString(16));
                    }
                    fileMarker = readUint16();
                }
                if (frames.length !== 1) {
                    println("only single frame JPEGs supported");
                }

                // set each frame's components quantization table
                for (var i = 0; i < frames.length; i++) {
                    var cp = frames[i].components;
                    for (var j in cp) {
                        cp[j].quantizationTable = quantizationTables[cp[j].quantizationIdx];
                        delete cp[j].quantizationIdx;
                    }
                }

                this.width = frame.samplesPerLine;
                this.height = frame.scanLines;
                this.jfif = jfif;
                this.adobe = adobe;
                this.components = [];
                for (var i = 0; i < frame.componentsOrder.length; i++) {
                    var component = frame.components[frame.componentsOrder[i]];
                    this.components.push({
                        lines: buildComponentData(frame, component),
                        scaleX: component.h / frame.maxH,
                        scaleY: component.v / frame.maxV
                    });
                }
            },
            getData: function getData(width, height) {
                var scaleX = this.width / width,
                    scaleY = this.height / height;

                var component1, component2, component3, component4;
                var component1Line, component2Line, component3Line, component4Line;
                var x, y;
                var offset = 0;
                var Y, Cb, Cr, K, C, M, Ye, R, G, B;
                var colorTransform;
                var dataLength = width * height * this.components.length;
                requestMemoryAllocation(dataLength);
                var data = new Uint8Array(dataLength);
                switch (this.components.length) {
                    case 1:
                        component1 = this.components[0];
                        for (y = 0; y < height; y++) {
                            component1Line = component1.lines[0 | (y * component1.scaleY * scaleY)];
                            for (x = 0; x < width; x++) {
                                Y = component1Line[0 | (x * component1.scaleX * scaleX)];

                                data[offset++] = Y;
                            }
                        }
                        break;
                    case 2:
                        // PDF might compress two component data in custom colorspace
                        component1 = this.components[0];
                        component2 = this.components[1];
                        for (y = 0; y < height; y++) {
                            component1Line = component1.lines[0 | (y * component1.scaleY * scaleY)];
                            component2Line = component2.lines[0 | (y * component2.scaleY * scaleY)];
                            for (x = 0; x < width; x++) {
                                Y = component1Line[0 | (x * component1.scaleX * scaleX)];
                                data[offset++] = Y;
                                Y = component2Line[0 | (x * component2.scaleX * scaleX)];
                                data[offset++] = Y;
                            }
                        }
                        break;
                    case 3:
                        // The default transform for three components is true
                        colorTransform = true;
                        // The adobe transform marker overrides any previous setting
                        if (this.adobe && this.adobe.transformCode) {
                            colorTransform = true;
                        } else if (typeof this.opts.colorTransform !== 'undefined') {
                            colorTransform = !!this.opts.colorTransform;
                        }

                        component1 = this.components[0];
                        component2 = this.components[1];
                        component3 = this.components[2];
                        for (y = 0; y < height; y++) {
                            component1Line = component1.lines[0 | (y * component1.scaleY * scaleY)];
                            component2Line = component2.lines[0 | (y * component2.scaleY * scaleY)];
                            component3Line = component3.lines[0 | (y * component3.scaleY * scaleY)];
                            for (x = 0; x < width; x++) {
                                if (!colorTransform) {
                                    R = component1Line[0 | (x * component1.scaleX * scaleX)];
                                    G = component2Line[0 | (x * component2.scaleX * scaleX)];
                                    B = component3Line[0 | (x * component3.scaleX * scaleX)];
                                } else {
                                    Y = component1Line[0 | (x * component1.scaleX * scaleX)];
                                    Cb = component2Line[0 | (x * component2.scaleX * scaleX)];
                                    Cr = component3Line[0 | (x * component3.scaleX * scaleX)];

                                    R = clampTo8bit(Y + 1.402 * (Cr - 128));
                                    G = clampTo8bit(Y - 0.3441363 * (Cb - 128) - 0.71413636 * (Cr - 128));
                                    B = clampTo8bit(Y + 1.772 * (Cb - 128));
                                }

                                data[offset++] = R;
                                data[offset++] = G;
                                data[offset++] = B;
                            }
                        }
                        break;
                    case 4:
                        if (!this.adobe) {
                            println('Unsupported color mode (4 components)');
                        }
                        // The default transform for four components is false
                        colorTransform = false;
                        // The adobe transform marker overrides any previous setting
                        if (this.adobe && this.adobe.transformCode) {
                            colorTransform = true;
                        } else if (typeof this.opts.colorTransform !== 'undefined') {
                            colorTransform = !!this.opts.colorTransform;
                        }

                        component1 = this.components[0];
                        component2 = this.components[1];
                        component3 = this.components[2];
                        component4 = this.components[3];
                        for (y = 0; y < height; y++) {
                            component1Line = component1.lines[0 | (y * component1.scaleY * scaleY)];
                            component2Line = component2.lines[0 | (y * component2.scaleY * scaleY)];
                            component3Line = component3.lines[0 | (y * component3.scaleY * scaleY)];
                            component4Line = component4.lines[0 | (y * component4.scaleY * scaleY)];
                            for (x = 0; x < width; x++) {
                                if (!colorTransform) {
                                    C = component1Line[0 | (x * component1.scaleX * scaleX)];
                                    M = component2Line[0 | (x * component2.scaleX * scaleX)];
                                    Ye = component3Line[0 | (x * component3.scaleX * scaleX)];
                                    K = component4Line[0 | (x * component4.scaleX * scaleX)];
                                } else {
                                    Y = component1Line[0 | (x * component1.scaleX * scaleX)];
                                    Cb = component2Line[0 | (x * component2.scaleX * scaleX)];
                                    Cr = component3Line[0 | (x * component3.scaleX * scaleX)];
                                    K = component4Line[0 | (x * component4.scaleX * scaleX)];

                                    C = 255 - clampTo8bit(Y + 1.402 * (Cr - 128));
                                    M = 255 - clampTo8bit(Y - 0.3441363 * (Cb - 128) - 0.71413636 * (Cr - 128));
                                    Ye = 255 - clampTo8bit(Y + 1.772 * (Cb - 128));
                                }
                                data[offset++] = 255 - C;
                                data[offset++] = 255 - M;
                                data[offset++] = 255 - Ye;
                                data[offset++] = 255 - K;
                            }
                        }
                        break;
                    default:
                        println('Unsupported color mode');
                }
                return data;
            },
            copyToImageData: function copyToImageData(imageData, formatAsRGBA) {
                var width = imageData.width,
                    height = imageData.height;
                var imageDataArray = imageData.data;
                var data = this.getData(width, height);
                var i = 0,
                    j = 0,
                    x, y;
                var Y, K, C, M, R, G, B;
                switch (this.components.length) {
                    case 1:
                        for (y = 0; y < height; y++) {
                            for (x = 0; x < width; x++) {
                                Y = data[i++];

                                imageDataArray[j++] = Y;
                                imageDataArray[j++] = Y;
                                imageDataArray[j++] = Y;
                                if (formatAsRGBA) {
                                    imageDataArray[j++] = 255;
                                }
                            }
                        }
                        break;
                    case 3:
                        for (y = 0; y < height; y++) {
                            for (x = 0; x < width; x++) {
                                R = data[i++];
                                G = data[i++];
                                B = data[i++];

                                imageDataArray[j++] = R;
                                imageDataArray[j++] = G;
                                imageDataArray[j++] = B;
                                if (formatAsRGBA) {
                                    imageDataArray[j++] = 255;
                                }
                            }
                        }
                        break;
                    case 4:
                        for (y = 0; y < height; y++) {
                            for (x = 0; x < width; x++) {
                                C = data[i++];
                                M = data[i++];
                                Y = data[i++];
                                K = data[i++];

                                R = 255 - clampTo8bit(C * (1 - K / 255) + K);
                                G = 255 - clampTo8bit(M * (1 - K / 255) + K);
                                B = 255 - clampTo8bit(Y * (1 - K / 255) + K);

                                imageDataArray[j++] = R;
                                imageDataArray[j++] = G;
                                imageDataArray[j++] = B;
                                if (formatAsRGBA) {
                                    imageDataArray[j++] = 255;
                                }
                            }
                        }
                        break;
                    default:
                        println('Unsupported color mode');
                }
            }
        };


        // We cap the amount of memory used by jpeg-js to avoid unexpected OOMs from untrusted content.
        var totalBytesAllocated = 0;
        var maxMemoryUsageBytes = 0;

        function requestMemoryAllocation(increaseAmount) {
            increaseAmount = increaseAmount || 0;
            var totalMemoryImpactBytes = totalBytesAllocated + increaseAmount;
            if (totalMemoryImpactBytes > maxMemoryUsageBytes) {
                var exceededAmount = Math.ceil((totalMemoryImpactBytes - maxMemoryUsageBytes) / 1024 / 1024);
                println("maxMemoryUsageInMB limit exceeded by at least ${exceededAmount}MB");
            }

            totalBytesAllocated = totalMemoryImpactBytes;
        }

        constructor.resetMaxMemoryUsage = function(maxMemoryUsageBytes_) {
            totalBytesAllocated = 0;
            maxMemoryUsageBytes = maxMemoryUsageBytes_;
        };

        constructor.getBytesAllocated = function() {
            return totalBytesAllocated;
        };

        constructor.requestMemoryAllocation = requestMemoryAllocation;

        return constructor;
    })()
};

ImageUtils.DecodeStream = (function() {

    var constructor = function() {
        this.pos = 0;
        this.bufferLength = 0;
        this.eof = false;
        this.buffer = null;
    };

    constructor.prototype = {
        ensureBuffer: function /*decodestream_ensureBuffer*/(requested) {
            var buffer = this.buffer;
            //var current = buffer ? buffer.byteLength : 0;  xxxx
            var current = buffer ? buffer.length : 0;
            if (requested < current) {
                return buffer;
            }
            var size = 512;
            while (size < requested) {
                size <<= 1;
            }
            var buffer2 = ImageUtils.newUintArray(size);
            for (var i = 0; i < current; ++i) {
                buffer2[i] = buffer[i];
            }
            this.buffer = buffer2;
            return this.buffer;
        },

        getBytes: function /*decodestream_getBytes*/(length) {
            var pos = this.pos;
            var end;

            if (length) {
                this.ensureBuffer(pos + length);
                var end = pos + length;

                while (!this.eof && this.bufferLength < end) {
                    this.readBlock();
                }
                var bufEnd = this.bufferLength;
                if (end > bufEnd) {
                    end = bufEnd;
                }
            } else {
                while (!this.eof) {
                    this.readBlock();
                }
                var end = this.bufferLength;
            }

            this.pos = end;
            //return this.buffer.subarray(pos, end); xxxx
            return this.buffer.slice(pos, end);
        },
    };

    return constructor;
})();

ImageUtils.FlateStream = (function() {
    var error = function(e) {
        throw new Error(e);
    };

    var codeLenCodeMap = ImageUtils.newUintArray([
        16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15
    ]);

    var lengthDecode = ImageUtils.newUintArray([
        0x00003, 0x00004, 0x00005, 0x00006, 0x00007, 0x00008, 0x00009, 0x0000a,
        0x1000b, 0x1000d, 0x1000f, 0x10011, 0x20013, 0x20017, 0x2001b, 0x2001f,
        0x30023, 0x3002b, 0x30033, 0x3003b, 0x40043, 0x40053, 0x40063, 0x40073,
        0x50083, 0x500a3, 0x500c3, 0x500e3, 0x00102, 0x00102, 0x00102
    ]);

    var distDecode = ImageUtils.newUintArray([
        0x00001, 0x00002, 0x00003, 0x00004, 0x10005, 0x10007, 0x20009, 0x2000d,
        0x30011, 0x30019, 0x40021, 0x40031, 0x50041, 0x50061, 0x60081, 0x600c1,
        0x70101, 0x70181, 0x80201, 0x80301, 0x90401, 0x90601, 0xa0801, 0xa0c01,
        0xb1001, 0xb1801, 0xc2001, 0xc3001, 0xd4001, 0xd6001
    ]);

    var fixedLitCodeTab = [ImageUtils.newUintArray([
        0x70100, 0x80050, 0x80010, 0x80118, 0x70110, 0x80070, 0x80030, 0x900c0,
        0x70108, 0x80060, 0x80020, 0x900a0, 0x80000, 0x80080, 0x80040, 0x900e0,
        0x70104, 0x80058, 0x80018, 0x90090, 0x70114, 0x80078, 0x80038, 0x900d0,
        0x7010c, 0x80068, 0x80028, 0x900b0, 0x80008, 0x80088, 0x80048, 0x900f0,
        0x70102, 0x80054, 0x80014, 0x8011c, 0x70112, 0x80074, 0x80034, 0x900c8,
        0x7010a, 0x80064, 0x80024, 0x900a8, 0x80004, 0x80084, 0x80044, 0x900e8,
        0x70106, 0x8005c, 0x8001c, 0x90098, 0x70116, 0x8007c, 0x8003c, 0x900d8,
        0x7010e, 0x8006c, 0x8002c, 0x900b8, 0x8000c, 0x8008c, 0x8004c, 0x900f8,
        0x70101, 0x80052, 0x80012, 0x8011a, 0x70111, 0x80072, 0x80032, 0x900c4,
        0x70109, 0x80062, 0x80022, 0x900a4, 0x80002, 0x80082, 0x80042, 0x900e4,
        0x70105, 0x8005a, 0x8001a, 0x90094, 0x70115, 0x8007a, 0x8003a, 0x900d4,
        0x7010d, 0x8006a, 0x8002a, 0x900b4, 0x8000a, 0x8008a, 0x8004a, 0x900f4,
        0x70103, 0x80056, 0x80016, 0x8011e, 0x70113, 0x80076, 0x80036, 0x900cc,
        0x7010b, 0x80066, 0x80026, 0x900ac, 0x80006, 0x80086, 0x80046, 0x900ec,
        0x70107, 0x8005e, 0x8001e, 0x9009c, 0x70117, 0x8007e, 0x8003e, 0x900dc,
        0x7010f, 0x8006e, 0x8002e, 0x900bc, 0x8000e, 0x8008e, 0x8004e, 0x900fc,
        0x70100, 0x80051, 0x80011, 0x80119, 0x70110, 0x80071, 0x80031, 0x900c2,
        0x70108, 0x80061, 0x80021, 0x900a2, 0x80001, 0x80081, 0x80041, 0x900e2,
        0x70104, 0x80059, 0x80019, 0x90092, 0x70114, 0x80079, 0x80039, 0x900d2,
        0x7010c, 0x80069, 0x80029, 0x900b2, 0x80009, 0x80089, 0x80049, 0x900f2,
        0x70102, 0x80055, 0x80015, 0x8011d, 0x70112, 0x80075, 0x80035, 0x900ca,
        0x7010a, 0x80065, 0x80025, 0x900aa, 0x80005, 0x80085, 0x80045, 0x900ea,
        0x70106, 0x8005d, 0x8001d, 0x9009a, 0x70116, 0x8007d, 0x8003d, 0x900da,
        0x7010e, 0x8006d, 0x8002d, 0x900ba, 0x8000d, 0x8008d, 0x8004d, 0x900fa,
        0x70101, 0x80053, 0x80013, 0x8011b, 0x70111, 0x80073, 0x80033, 0x900c6,
        0x70109, 0x80063, 0x80023, 0x900a6, 0x80003, 0x80083, 0x80043, 0x900e6,
        0x70105, 0x8005b, 0x8001b, 0x90096, 0x70115, 0x8007b, 0x8003b, 0x900d6,
        0x7010d, 0x8006b, 0x8002b, 0x900b6, 0x8000b, 0x8008b, 0x8004b, 0x900f6,
        0x70103, 0x80057, 0x80017, 0x8011f, 0x70113, 0x80077, 0x80037, 0x900ce,
        0x7010b, 0x80067, 0x80027, 0x900ae, 0x80007, 0x80087, 0x80047, 0x900ee,
        0x70107, 0x8005f, 0x8001f, 0x9009e, 0x70117, 0x8007f, 0x8003f, 0x900de,
        0x7010f, 0x8006f, 0x8002f, 0x900be, 0x8000f, 0x8008f, 0x8004f, 0x900fe,
        0x70100, 0x80050, 0x80010, 0x80118, 0x70110, 0x80070, 0x80030, 0x900c1,
        0x70108, 0x80060, 0x80020, 0x900a1, 0x80000, 0x80080, 0x80040, 0x900e1,
        0x70104, 0x80058, 0x80018, 0x90091, 0x70114, 0x80078, 0x80038, 0x900d1,
        0x7010c, 0x80068, 0x80028, 0x900b1, 0x80008, 0x80088, 0x80048, 0x900f1,
        0x70102, 0x80054, 0x80014, 0x8011c, 0x70112, 0x80074, 0x80034, 0x900c9,
        0x7010a, 0x80064, 0x80024, 0x900a9, 0x80004, 0x80084, 0x80044, 0x900e9,
        0x70106, 0x8005c, 0x8001c, 0x90099, 0x70116, 0x8007c, 0x8003c, 0x900d9,
        0x7010e, 0x8006c, 0x8002c, 0x900b9, 0x8000c, 0x8008c, 0x8004c, 0x900f9,
        0x70101, 0x80052, 0x80012, 0x8011a, 0x70111, 0x80072, 0x80032, 0x900c5,
        0x70109, 0x80062, 0x80022, 0x900a5, 0x80002, 0x80082, 0x80042, 0x900e5,
        0x70105, 0x8005a, 0x8001a, 0x90095, 0x70115, 0x8007a, 0x8003a, 0x900d5,
        0x7010d, 0x8006a, 0x8002a, 0x900b5, 0x8000a, 0x8008a, 0x8004a, 0x900f5,
        0x70103, 0x80056, 0x80016, 0x8011e, 0x70113, 0x80076, 0x80036, 0x900cd,
        0x7010b, 0x80066, 0x80026, 0x900ad, 0x80006, 0x80086, 0x80046, 0x900ed,
        0x70107, 0x8005e, 0x8001e, 0x9009d, 0x70117, 0x8007e, 0x8003e, 0x900dd,
        0x7010f, 0x8006e, 0x8002e, 0x900bd, 0x8000e, 0x8008e, 0x8004e, 0x900fd,
        0x70100, 0x80051, 0x80011, 0x80119, 0x70110, 0x80071, 0x80031, 0x900c3,
        0x70108, 0x80061, 0x80021, 0x900a3, 0x80001, 0x80081, 0x80041, 0x900e3,
        0x70104, 0x80059, 0x80019, 0x90093, 0x70114, 0x80079, 0x80039, 0x900d3,
        0x7010c, 0x80069, 0x80029, 0x900b3, 0x80009, 0x80089, 0x80049, 0x900f3,
        0x70102, 0x80055, 0x80015, 0x8011d, 0x70112, 0x80075, 0x80035, 0x900cb,
        0x7010a, 0x80065, 0x80025, 0x900ab, 0x80005, 0x80085, 0x80045, 0x900eb,
        0x70106, 0x8005d, 0x8001d, 0x9009b, 0x70116, 0x8007d, 0x8003d, 0x900db,
        0x7010e, 0x8006d, 0x8002d, 0x900bb, 0x8000d, 0x8008d, 0x8004d, 0x900fb,
        0x70101, 0x80053, 0x80013, 0x8011b, 0x70111, 0x80073, 0x80033, 0x900c7,
        0x70109, 0x80063, 0x80023, 0x900a7, 0x80003, 0x80083, 0x80043, 0x900e7,
        0x70105, 0x8005b, 0x8001b, 0x90097, 0x70115, 0x8007b, 0x8003b, 0x900d7,
        0x7010d, 0x8006b, 0x8002b, 0x900b7, 0x8000b, 0x8008b, 0x8004b, 0x900f7,
        0x70103, 0x80057, 0x80017, 0x8011f, 0x70113, 0x80077, 0x80037, 0x900cf,
        0x7010b, 0x80067, 0x80027, 0x900af, 0x80007, 0x80087, 0x80047, 0x900ef,
        0x70107, 0x8005f, 0x8001f, 0x9009f, 0x70117, 0x8007f, 0x8003f, 0x900df,
        0x7010f, 0x8006f, 0x8002f, 0x900bf, 0x8000f, 0x8008f, 0x8004f, 0x900ff
    ]), 9];

    var fixedDistCodeTab = [ImageUtils.newUintArray([
        0x50000, 0x50010, 0x50008, 0x50018, 0x50004, 0x50014, 0x5000c, 0x5001c,
        0x50002, 0x50012, 0x5000a, 0x5001a, 0x50006, 0x50016, 0x5000e, 0x00000,
        0x50001, 0x50011, 0x50009, 0x50019, 0x50005, 0x50015, 0x5000d, 0x5001d,
        0x50003, 0x50013, 0x5000b, 0x5001b, 0x50007, 0x50017, 0x5000f, 0x00000
    ]), 5];

    var constructor = function(bytes) {
        //var bytes = stream.getBytes();
        var bytesPos = 0;

        var cmf = bytes[bytesPos++];
        var flg = bytes[bytesPos++];
        if (cmf === -1 || flg === -1) {
            error('Invalid header in flate stream');
        }
        if ((cmf & 0x0f) !== 0x08) {
            error('Unknown compression method in flate stream');
        }
        if ((((cmf << 8) + flg) % 31) !== 0) {
            error('Bad FCHECK in flate stream');
        }
        if (flg & 0x20) {
            error('FDICT bit set in flate stream');
        }

        this.bytes = bytes;
        this.bytesPos = bytesPos;

        this.codeSize = 0;
        this.codeBuf = 0;

        ImageUtils.DecodeStream.call(this);
    };

    constructor.prototype = Object.create(ImageUtils.DecodeStream.prototype);

    constructor.prototype.getBits = function(bits) {
        var codeSize = this.codeSize;
        var codeBuf = this.codeBuf;
        var bytes = this.bytes;
        var bytesPos = this.bytesPos;

        var b;
        while (codeSize < bits) {
            if (typeof(b = bytes[bytesPos++]) === 'undefined') {
                error('Bad encoding in flate stream');
            }
            codeBuf |= b << codeSize;
            codeSize += 8;
        }
        b = codeBuf & ((1 << bits) - 1);
        this.codeBuf = codeBuf >> bits;
        this.codeSize = codeSize -= bits;
        this.bytesPos = bytesPos;
        return b;
    };

    constructor.prototype.getCode = function(table) {
        var codes = table[0];
        var maxLen = table[1];
        var codeSize = this.codeSize;
        var codeBuf = this.codeBuf;
        var bytes = this.bytes;
        var bytesPos = this.bytesPos;

        while (codeSize < maxLen) {
            var b;
            if (typeof(b = bytes[bytesPos++]) === 'undefined') {
                error('Bad encoding in flate stream');
            }
            codeBuf |= (b << codeSize);
            codeSize += 8;
        }
        var code = codes[codeBuf & ((1 << maxLen) - 1)];
        var codeLen = code >> 16;
        var codeVal = code & 0xffff;
        if (codeSize === 0 || codeSize < codeLen || codeLen === 0) {
            error('Bad encoding in flate stream');
        }
        this.codeBuf = (codeBuf >> codeLen);
        this.codeSize = (codeSize - codeLen);
        this.bytesPos = bytesPos;
        return codeVal;
    };

    constructor.prototype.generateHuffmanTable = function(lengths) {
        var n = lengths.length;

        // find max code length
        var maxLen = 0;
        for (var i = 0; i < n; ++i) {
            if (lengths[i] > maxLen) {
                maxLen = lengths[i];
            }
        }

        // build the table
        var size = 1 << maxLen;
        var codes = ImageUtils.newUintArray(size);
        for (var len = 1, code = 0, skip = 2; len <= maxLen;
            ++len, code <<= 1, skip <<= 1) {
            for (var val = 0; val < n; ++val) {
                if (lengths[val] === len) {
                    // bit-reverse the code
                    var code2 = 0;
                    var t = code;
                    for (var i = 0; i < len; ++i) {
                        code2 = (code2 << 1) | (t & 1);
                        t >>= 1;
                    }

                    // fill the table entries
                    for (var i = code2; i < size; i += skip) {
                        codes[i] = (len << 16) | val;
                    }
                    ++code;
                }
            }
        }

        return [codes, maxLen];
    };

    constructor.prototype.readBlock = function() {
        var i; /* hoisted by blyon */
        var repeat = function(stream, array, len, offset, what) {
            var repeat = stream.getBits(len) + offset;
            while (repeat-- > 0) {
                array[i++] = what;
            }
        };

        // read block header
        var hdr = this.getBits(3);
        if (hdr & 1) {
            this.eof = true;
        }
        hdr >>= 1;

        if (hdr === 0) { // uncompressed block
            var bytes = this.bytes;
            var bytesPos = this.bytesPos;
            var b;

            if (typeof(b = bytes[bytesPos++]) === 'undefined') {
                error('Bad block header in flate stream');
            }
            var blockLen = b;
            if (typeof(b = bytes[bytesPos++]) === 'undefined') {
                error('Bad block header in flate stream');
            }
            blockLen |= (b << 8);
            if (typeof(b = bytes[bytesPos++]) === 'undefined') {
                error('Bad block header in flate stream');
            }
            var check = b;
            if (typeof(b = bytes[bytesPos++]) === 'undefined') {
                error('Bad block header in flate stream');
            }
            check |= (b << 8);
            if (check !== (~blockLen & 0xffff)) {
                error('Bad uncompressed block length in flate stream');
            }
            this.codeBuf = 0;
            this.codeSize = 0;

            var bufferLength = this.bufferLength;
            var buffer = this.ensureBuffer(bufferLength + blockLen);
            var end = bufferLength + blockLen;
            this.bufferLength = end;
            for (var n = bufferLength; n < end; ++n) {
                if (typeof(b = bytes[bytesPos++]) === 'undefined') {
                    this.eof = true;
                    break;
                }
                buffer[n] = b;
            }
            this.bytesPos = bytesPos;
            return;
        }

        var litCodeTable;
        var distCodeTable;
        if (hdr === 1) { // compressed block, fixed codes
            litCodeTable = fixedLitCodeTab;
            distCodeTable = fixedDistCodeTab;
        } else if (hdr === 2) { // compressed block, dynamic codes
            var numLitCodes = this.getBits(5) + 257;
            var numDistCodes = this.getBits(5) + 1;
            var numCodeLenCodes = this.getBits(4) + 4;

            // build the code lengths code table
            var codeLenCodeLengths = Array(codeLenCodeMap.length);
            var i = 0;
            while (i < numCodeLenCodes) {
                codeLenCodeLengths[codeLenCodeMap[i++]] = this.getBits(3);
            }
            var codeLenCodeTab = this.generateHuffmanTable(codeLenCodeLengths);

            // build the literal and distance code tables
            var len = 0;
            var i = 0;
            var codes = numLitCodes + numDistCodes;
            var codeLengths = new Array(codes);
            while (i < codes) {
                var code = this.getCode(codeLenCodeTab);
                if (code === 16) {
                    repeat(this, codeLengths, 2, 3, len);
                } else if (code === 17) {
                    repeat(this, codeLengths, 3, 3, len = 0);
                } else if (code === 18) {
                    repeat(this, codeLengths, 7, 11, len = 0);
                } else {
                    codeLengths[i++] = len = code;
                }
            }

            litCodeTable = this.generateHuffmanTable(codeLengths.slice(0, numLitCodes));
            distCodeTable = this.generateHuffmanTable(codeLengths.slice(numLitCodes, codes));
        } else {
            error('Unknown block type in flate stream');
        }

        var buffer = this.buffer;
        var limit = buffer ? buffer.length : 0;
        var pos = this.bufferLength;
        while (true) {
            var code1 = this.getCode(litCodeTable);
            if (code1 < 256) {
                if (pos + 1 >= limit) {
                    buffer = this.ensureBuffer(pos + 1);
                    limit = buffer.length;
                }
                buffer[pos++] = code1;
                continue;
            }
            if (code1 === 256) {
                this.bufferLength = pos;
                return;
            }
            code1 -= 257;
            code1 = lengthDecode[code1];
            var code2 = code1 >> 16;
            if (code2 > 0) {
                code2 = this.getBits(code2);
            }
            var len = (code1 & 0xffff) + code2;
            code1 = this.getCode(distCodeTable);
            code1 = distDecode[code1];
            code2 = code1 >> 16;
            if (code2 > 0) {
                code2 = this.getBits(code2);
            }
            var dist = (code1 & 0xffff) + code2;
            if (pos + len >= limit) {
                buffer = this.ensureBuffer(pos + len);
                limit = buffer.length;
            }
            for (var k = 0; k < len; ++k, ++pos) {
                buffer[pos] = buffer[pos - dist];
            }
        }
    };

    return constructor;
})();

var PNG = (function() {
    var APNG_BLEND_OP_OVER, APNG_BLEND_OP_SOURCE, APNG_DISPOSE_OP_BACKGROUND, APNG_DISPOSE_OP_NONE, APNG_DISPOSE_OP_PREVIOUS, makeImage, scratchCanvas, scratchCtx;

    var PNG = function(data) {
        if (typeof data === "string") {
            data = ImageUtils.asciiToBinary(data);
        }

        var chunkSize, colors, delayDen, delayNum, frame, i, index, key, section, short, text, _i, _j, _ref;
        this.pos = 8;
        this.palette = [];
        this.imgData = [];
        this.transparency = {};
        this.animation = null;
        this.text = {};
        this.data = data = ImageUtils.newUintArray(data);
        frame = null;

        var getColors = function() {
            switch (this.colorType) {
                case 0:
                case 3:
                case 4:
                    return 1;
                case 2:
                case 6:
                    return 3;
            }
        };

        var colorSpace = function() {
            switch (this.colors) {
                case 1:
                    return 'DeviceGray';
                case 3:
                    return 'DeviceRGB';
            }
        };

        var getSection = function() {
            var _i, _results;
            _results = [];
            for (i = _i = 0; _i < 4; i = ++_i) {
                _results.push(String.fromCharCode(this.data[this.pos++]));
            }
            return _results;
        };

        while (true) {
            chunkSize = this.readUInt32();
            section = getSection.call(this).join('');
            switch (section) {
                case 'IHDR':
                    this.width = this.readUInt32();
                    this.height = this.readUInt32();
                    this.bits = this.data[this.pos++];
                    this.colorType = this.data[this.pos++];
                    this.compressionMethod = this.data[this.pos++];
                    this.filterMethod = this.data[this.pos++];
                    this.interlaceMethod = this.data[this.pos++];
                    break;
                case 'acTL':
                    this.animation = {
                        numFrames: this.readUInt32(),
                        numPlays: this.readUInt32() || Infinity,
                        frames: []
                    };
                    break;
                case 'PLTE':
                    this.palette = this.read(chunkSize);
                    break;
                case 'fcTL':
                    if (frame) {
                        this.animation.frames.push(frame);
                    }
                    this.pos += 4;
                    frame = {
                        width: this.readUInt32(),
                        height: this.readUInt32(),
                        xOffset: this.readUInt32(),
                        yOffset: this.readUInt32()
                    };
                    delayNum = this.readUInt16();
                    delayDen = this.readUInt16() || 100;
                    frame.delay = 1000 * delayNum / delayDen;
                    frame.disposeOp = this.data[this.pos++];
                    frame.blendOp = this.data[this.pos++];
                    frame.data = [];
                    break;
                case 'IDAT':
                case 'fdAT':
                    if (section === 'fdAT') {
                        this.pos += 4;
                        chunkSize -= 4;
                    }
                    data = (frame ? frame.data : 0) || this.imgData;
                    for (i = _i = 0; 0 <= chunkSize ? _i < chunkSize : _i > chunkSize; i = 0 <= chunkSize ? ++_i : --_i) {
                        data.push(this.data[this.pos++]);
                    }
                    break;
                case 'tRNS':
                    this.transparency = {};
                    switch (this.colorType) {
                        case 3:
                            this.transparency.indexed = this.read(chunkSize);
                            short = 255 - this.transparency.indexed.length;
                            if (short > 0) {
                                for (i = _j = 0; 0 <= short ? _j < short : _j > short; i = 0 <= short ? ++_j : --_j) {
                                    this.transparency.indexed.push(255);
                                }
                            }
                            break;
                        case 0:
                            this.transparency.grayscale = this.read(chunkSize)[0];
                            break;
                        case 2:
                            this.transparency.rgb = this.read(chunkSize);
                    }
                    break;
                case 'tEXt':
                    text = this.read(chunkSize);
                    index = text.indexOf(0);
                    key = String.fromCharCode.apply(String, text.slice(0, index));
                    this.text[key] = String.fromCharCode.apply(String, text.slice(index + 1));
                    break;
                case 'IEND':
                    if (frame) {
                        this.animation.frames.push(frame);
                    }
                    this.colors = getColors.call(this);
                    this.hasAlphaChannel = (_ref = this.colorType) === 4 || _ref === 6;
                    colors = this.colors + (this.hasAlphaChannel ? 1 : 0);
                    this.pixelBitlength = this.bits * colors;
                    this.colorSpace = colorSpace.call(this);
                    this.imgData = ImageUtils.newUintArray(this.imgData);
                    return;
                default:
                    this.pos += chunkSize;
            }
            this.pos += 4;
            if (this.pos > this.data.length) {
                throw new Error("Incomplete or corrupt PNG file");
            }
        }
        return;
    };

    PNG.prototype.read = function(bytes) {
        var i, _i, _results;
        _results = [];
        for (i = _i = 0; 0 <= bytes ? _i < bytes : _i > bytes; i = 0 <= bytes ? ++_i : --_i) {
            _results.push(this.data[this.pos++]);
        }
        return _results;
    };

    APNG_DISPOSE_OP_NONE = 0;

    APNG_DISPOSE_OP_BACKGROUND = 1;

    APNG_DISPOSE_OP_PREVIOUS = 2;

    APNG_BLEND_OP_SOURCE = 0;

    APNG_BLEND_OP_OVER = 1;

    PNG.prototype.readUInt32 = function() {
        var b1, b2, b3, b4;
        b1 = this.data[this.pos++] << 24;
        b2 = this.data[this.pos++] << 16;
        b3 = this.data[this.pos++] << 8;
        b4 = this.data[this.pos++];
        return b1 | b2 | b3 | b4;
    };

    PNG.prototype.readUInt16 = function() {
        var b1, b2;
        b1 = this.data[this.pos++] << 8;
        b2 = this.data[this.pos++];
        return b1 | b2;
    };

    PNG.prototype.decodePixels = function(data) {
        var byte, c, col, i, left, length, p, pa, paeth, pb, pc, pixelBytes, pixels, pos, row, scanlineLength, upper, upperLeft, _i, _j, _k, _l, _m;
        if (!data) {
            data = this.imgData;
        }
        if (data.length === 0) {
            return ImageUtils.newUintArray(0);
        }
        data = new ImageUtils.FlateStream(data);
        data = data.getBytes();
        pixelBytes = this.pixelBitlength / 8;
        scanlineLength = pixelBytes * this.width;
        pixels = ImageUtils.newUintArray(scanlineLength * this.height);
        length = data.length;
        row = 0;
        pos = 0;
        c = 0;
        while (pos < length) {
            switch (data[pos++]) {
                case 0:
                    for (i = _i = 0; _i < scanlineLength; i = _i += 1) {
                        pixels[c++] = data[pos++];
                    }
                    break;
                case 1:
                    for (i = _j = 0; _j < scanlineLength; i = _j += 1) {
                        byte = data[pos++];
                        left = i < pixelBytes ? 0 : pixels[c - pixelBytes];
                        pixels[c++] = (byte + left) % 256;
                    }
                    break;
                case 2:
                    for (i = _k = 0; _k < scanlineLength; i = _k += 1) {
                        byte = data[pos++];
                        col = (i - (i % pixelBytes)) / pixelBytes;
                        upper = row && pixels[(row - 1) * scanlineLength + col * pixelBytes + (i % pixelBytes)];
                        pixels[c++] = (upper + byte) % 256;
                    }
                    break;
                case 3:
                    for (i = _l = 0; _l < scanlineLength; i = _l += 1) {
                        byte = data[pos++];
                        col = (i - (i % pixelBytes)) / pixelBytes;
                        left = i < pixelBytes ? 0 : pixels[c - pixelBytes];
                        upper = row && pixels[(row - 1) * scanlineLength + col * pixelBytes + (i % pixelBytes)];
                        pixels[c++] = (byte + Math.floor((left + upper) / 2)) % 256;
                    }
                    break;
                case 4:
                    for (i = _m = 0; _m < scanlineLength; i = _m += 1) {
                        byte = data[pos++];
                        col = (i - (i % pixelBytes)) / pixelBytes;
                        left = i < pixelBytes ? 0 : pixels[c - pixelBytes];
                        if (row === 0) {
                            upper = upperLeft = 0;
                        } else {
                            upper = pixels[(row - 1) * scanlineLength + col * pixelBytes + (i % pixelBytes)];
                            upperLeft = col && pixels[(row - 1) * scanlineLength + (col - 1) * pixelBytes + (i % pixelBytes)];
                        }
                        p = left + upper - upperLeft;
                        pa = Math.abs(p - left);
                        pb = Math.abs(p - upper);
                        pc = Math.abs(p - upperLeft);
                        if (pa <= pb && pa <= pc) {
                            paeth = left;
                        } else if (pb <= pc) {
                            paeth = upper;
                        } else {
                            paeth = upperLeft;
                        }
                        pixels[c++] = (byte + paeth) % 256;
                    }
                    break;
                default:
                    println("Oh Noes!!!");
                    throw new Error("Invalid filter algorithm: " + data[pos - 1]);
            }
            row++;
        }
        return pixels;
    };

    PNG.prototype.decodePalette = function() {
        var c, i, length, palette, pos, ret, transparency, _i, _ref, _ref1;
        palette = this.palette;
        transparency = this.transparency.indexed || [];
        ret = ImageUtils.newUintArray((transparency.length || 0) + palette.length);
        pos = 0;
        length = palette.length;
        c = 0;
        for (i = _i = 0, _ref = palette.length; _i < _ref; i = _i += 3) {
            ret[pos++] = palette[i];
            ret[pos++] = palette[i + 1];
            ret[pos++] = palette[i + 2];
            ret[pos++] = (_ref1 = transparency[c++]) ? _ref1 : 255;
        }
        return ret;
    };

    PNG.prototype.copyToImageData = function(imageData, pixels) {
        var alpha, colors, data, i, input, j, k, length, palette, v, _ref;
        colors = this.colors;
        palette = null;
        alpha = this.hasAlphaChannel;
        if (this.palette.length) {
            palette = (_ref = this._decodedPalette) ? _ref : this._decodedPalette = this.decodePalette();
            colors = 4;
            alpha = true;
        }
        data = imageData.data || imageData;
        length = data.length;
        input = palette || pixels;
        i = j = 0;
        if (colors === 1) {
            while (i < length) {
                k = palette ? pixels[i / 4] * 4 : j;
                v = input[k++];
                data[i++] = v;
                data[i++] = v;
                data[i++] = v;
                data[i++] = alpha ? input[k++] : 255;
                j = k;
            }
        } else {
            while (i < length) {
                k = palette ? pixels[i / 4] * 4 : j;
                data[i++] = input[k++];
                data[i++] = input[k++];
                data[i++] = input[k++];
                data[i++] = alpha ? input[k++] : 255;
                j = k;
            }
        }
    };

    PNG.prototype.decode = function() {
        var ret = ImageUtils.newUintArray(this.width * this.height * 4);
        this.copyToImageData(ret, this.decodePixels());
        return ret;
    };

    PNG.prototype.decodeFrames = function(ctx) {
        var frame, i, imageData, pixels, _i, _len, _ref, _results;
        if (!this.animation) {
            return;
        }
        _ref = this.animation.frames;
        _results = [];
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
            frame = _ref[i];
            imageData = ctx.createImageData(frame.width, frame.height);
            pixels = this.decodePixels(ImageUtils.newUintArray(frame.data));
            this.copyToImageData(imageData, pixels);
            frame.imageData = imageData;
            _results.push(frame.image = makeImage(imageData));
        }
        return _results;
    };

    PNG.prototype.render = function(canvas) {
        var ctx, data;
        canvas._png = this;
        canvas.width = this.width;
        canvas.height = this.height;
        ctx = canvas.getContext("2d");
        if (this.animation) {
            this.decodeFrames(ctx);
            return this.animate(ctx);
        } else {
            data = ctx.createImageData(this.width, this.height);
            this.copyToImageData(data, this.decodePixels());
            return ctx.putImageData(data, 0, 0);
        }
    };

    PNG.prototype.toImageData = function() {
        var imgData = Reflect.construct(ImageData, [
            Reflect.construct(Uint8ClampedArray, [this.decodePixels()]),
            this.width,
            this.height
        ]);
        return imgData;
    };

    return PNG;
})();

var JPEG = function(jpegData, userOpts) {
    if (typeof jpegData === "string") {
        jpegData = new Uint8Array(ImageUtils.asciiToBinary(jpegData));
    }

    userOpts = userOpts || {};
    var defaultOpts = {
        // "undefined" means "Choose whether to transform colors based on the image’s color model."
        colorTransform: undefined,
        useTArray: true,
        formatAsRGBA: true,
        tolerantDecoding: true,
        maxResolutionInMP: 1, // Don't decode more than 100 megapixels
        maxMemoryUsageInMB: 25, // Don't decode if memory footprint is more than 512MB
    };

    var opts = {};
    for (var property in defaultOpts) {
        opts[property] = defaultOpts[property];
    }
    for (var property in userOpts) {
        opts[property] = userOpts[property];
    }
    var arr = jpegData;
    var decoder = new ImageUtils.JpegImageDecoder();
    decoder.opts = opts;
    ImageUtils.JpegImageDecoder.resetMaxMemoryUsage(opts.maxMemoryUsageInMB * 1024 * 1024);
    decoder.parse(arr);

    var channels = (opts.formatAsRGBA) ? 4 : 3;
    var bytesNeeded = decoder.width * decoder.height * channels;

    ImageUtils.JpegImageDecoder.requestMemoryAllocation(bytesNeeded);

    var image_ = {
        width: decoder.width,
        height: decoder.height,
        exifBuffer: decoder.exifBuffer,
        data: new Uint8Array(bytesNeeded),
        toImageData: function() {
            var imgData = new ImageData(
                new Uint8ClampedArray(this.data),
                this.width,
                this.height
            );

            return imgData;
        }
    };

    if (decoder.comments.length > 0) {
        image_.comments = decoder.comments;
    }

    decoder.copyToImageData(image_, opts.formatAsRGBA);

    return image_;
};

var QOI = function(arrayBuffer, byteOffset, byteLength, outputChannels) {
    if (typeof arrayBuffer === "string") {
        // get the body of the base64 string
        var b64Body = arrayBuffer.split(",");
        b64Body = b64Body[b64Body.length - 1];

        arrayBuffer = new Uint8Array(ImageUtils.asciiToBinary(b64Body)).buffer;
    }

    /**
        Decode a QOI file given as an ArrayBuffer.
        @param {ArrayBuffer} arrayBuffer ArrayBuffer containing the QOI file.
        @param {int|null} [byteOffset] Offset to the start of the QOI file in arrayBuffer
        @param {int|null} [byteLength] Length of the QOI file in bytes
        @param {int|null} [outputChannels] Number of channels to include in the decoded array
        @returns {{channels: number, data: Uint8Array, colorspace: number, width: number, error: boolean, height: number}}
    **/

    var onErr = console.log;

    if (typeof byteOffset === 'undefined' || byteOffset === null) {
        byteOffset = 0;
    }

    if (typeof byteLength === 'undefined' || byteLength === null) {
        byteLength = arrayBuffer.byteLength - byteOffset;
    }

    var uint8 = new Uint8Array(arrayBuffer, byteOffset, byteLength);

    var magic1 = uint8[0];
    var magic2 = uint8[1];
    var magic3 = uint8[2];
    var magic4 = uint8[3];

    var width = ((uint8[4] << 24) | (uint8[5] << 16) | (uint8[6] << 8) | uint8[7]) >>> 0;
    var height = ((uint8[8] << 24) | (uint8[9] << 16) | (uint8[10] << 8) | uint8[11]) >>> 0;

    var channels = uint8[12];
    var colorspace = uint8[13];

    if (typeof outputChannels === 'undefined' || outputChannels === null) {
        outputChannels = channels;
    }

    if (magic1 !== 0x71 || magic2 !== 0x6F || magic3 !== 0x69 || magic4 !== 0x66) {
        onErr('QOI.decode: The signature of the QOI file is invalid');
    }

    if (channels < 3 || channels > 4) {
        onErr('QOI.decode: The number of channels declared in the file is invalid');
    }

    if (colorspace > 1) {
        onErr('QOI.decode: The colorspace declared in the file is invalid');
    }

    if (outputChannels < 3 || outputChannels > 4) {
        onErr('QOI.decode: The number of channels for the output is invalid');
    }

    var pixelLength = width * height * outputChannels;

    var result = new Uint8Array(pixelLength);

    var arrayPosition = 14;

    var index = new Uint8Array(64 * 4);
    var indexPosition = 0;

    var red = 0;
    var green = 0;
    var blue = 0;
    var alpha = 255;

    var chunksLength = byteLength - 8;

    var run = 0;
    var pixelPosition = 0;

    var NUM_0b11111110 = Number("0b11111110");
    var NUM_0b11111111 = Number("0b11111111");
    var NUM_0b11000000 = Number("0b11000000");
    var NUM_0b00000000 = Number("0b00000000");
    var NUM_0b01000000 = Number("0b01000000");
    var NUM_0b00000011 = Number("0b00000011");
    var NUM_0b10000000 = Number("0b10000000");
    var NUM_0b00111111 = Number("0b00111111");
    var NUM_0b00001111 = Number("0b00001111");

    for (; pixelPosition < pixelLength && arrayPosition < byteLength - 4; pixelPosition += outputChannels) {
        if (run > 0) {
            run--;
        } else if (arrayPosition < chunksLength) {
            var byte1 = uint8[arrayPosition++];

            if (byte1 === NUM_0b11111110) { // QOI_OP_RGB
                red = uint8[arrayPosition++];
                green = uint8[arrayPosition++];
                blue = uint8[arrayPosition++];
            } else if (byte1 === NUM_0b11111111) { // QOI_OP_RGBA
                red = uint8[arrayPosition++];
                green = uint8[arrayPosition++];
                blue = uint8[arrayPosition++];
                alpha = uint8[arrayPosition++];
            } else if ((byte1 & NUM_0b11000000) === NUM_0b00000000) { // QOI_OP_INDEX
                red = index[byte1 * 4];
                green = index[byte1 * 4 + 1];
                blue = index[byte1 * 4 + 2];
                alpha = index[byte1 * 4 + 3];
            } else if ((byte1 & NUM_0b11000000) === NUM_0b01000000) { // QOI_OP_DIFF
                red += ((byte1 >> 4) & NUM_0b00000011) - 2;
                green += ((byte1 >> 2) & NUM_0b00000011) - 2;
                blue += (byte1 & NUM_0b00000011) - 2;

                // handle wraparound
                red = (red + 256) % 256;
                green = (green + 256) % 256;
                blue = (blue + 256) % 256;
            } else if ((byte1 & NUM_0b11000000) === NUM_0b10000000) { // QOI_OP_LUMA
                var byte2 = uint8[arrayPosition++];
                var greenDiff = (byte1 & NUM_0b00111111) - 32;
                var redDiff = greenDiff + ((byte2 >> 4) & NUM_0b00001111) - 8;
                var blueDiff = greenDiff + (byte2 & NUM_0b00001111) - 8;

                // handle wraparound
                red = (red + redDiff + 256) % 256;
                green = (green + greenDiff + 256) % 256;
                blue = (blue + blueDiff + 256) % 256;
            } else if ((byte1 & NUM_0b11000000) === NUM_0b11000000) { // QOI_OP_RUN
                run = byte1 & NUM_0b00111111;
            }

            indexPosition = ((red * 3 + green * 5 + blue * 7 + alpha * 11) % 64) * 4;
            index[indexPosition] = red;
            index[indexPosition + 1] = green;
            index[indexPosition + 2] = blue;
            index[indexPosition + 3] = alpha;
        }

        if (outputChannels === 4) { // RGBA
            result[pixelPosition] = red;
            result[pixelPosition + 1] = green;
            result[pixelPosition + 2] = blue;
            result[pixelPosition + 3] = alpha;
        } else { // RGB
            result[pixelPosition] = red;
            result[pixelPosition + 1] = green;
            result[pixelPosition + 2] = blue;
        }
    }

    if (pixelPosition < pixelLength) {
        onErr('QOI.decode: Incomplete image');
    }

    // checking the 00000001 padding is not required, as per specs

    return {
        width: width,
        height: height,
        colorspace: colorspace,
        channels: outputChannels,
        data: result,
        toImageData: function() {
            var data;
            if (this.width * this.height * 4 !== this.data.length) {
                // is in RGB; convert to RGBA
                data = new Uint8ClampedArray(this.width * this.height * 4);
                var dataIdx = 0;
                for (var i = 0; i < this.data.length; i += 3) {
                    data[dataIdx] = this.data[i];
                    data[dataIdx + 1] = this.data[i + 1];
                    data[dataIdx + 2] = this.data[i + 2];
                    data[dataIdx + 3] = 255;
                    dataIdx += 4;
                }

            } else {
                data = new Uint8ClampedArray(this.data);
            }

            return new ImageData(data, this.width, this.height);
        }
    };
};

var BMP = function(data, pixelOffset) {
    var s = data.split(",");
    data = s[s.length - 1]; /* strip away header */

    var pixel_data_array = ImageUtils.asciiToBinary(data);

    function readX(index, x) {
        var total = 0;
        for (var i = 0; i < x; i++) {
            total += pixel_data_array[index + i] * Math.pow(256, i);
        }
        return total;
    }

    return {
        rawData: pixel_data_array,
        toImageData: function () {
            var pixel_data_array = this.rawData;
            
            var w = readX(18, 4);
            var h = readX(22, 4);
        
            var x = 0;
            var y = 0;
            var i = 2 + -4 * ~~(w / 1.222 + pixelOffset || 0);
        
            var imgData = new ImageData(w, h);
        
            while (i < pixel_data_array.length) {
                var idx = (x + (h - y) * w) << 2;
        
                imgData.data[idx] = pixel_data_array[i + 2];
                imgData.data[idx + 1] = pixel_data_array[i + 1];
                imgData.data[idx + 2] = pixel_data_array[i + 0];
                imgData.data[idx + 3] = 255;
        
                x++;
                if (x >= w) {
                    x = 0;
                    y++;
                }
        
                i += 4;
            };
            
            return imgData;
        }
    };
};

function ImageDataToImage (imagedata) {
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    canvas.width = imagedata.width;
    canvas.height = imagedata.height;
    ctx.putImageData(imagedata, 0, 0);

    let image = new Image();
    image.src = canvas.toDataURL("image/png");
    return image;
}

var createImage = function (base64) {
    var output = null;
    var type = base64.split(",")[0].split("/")[1].split(";")[0].toLowerCase();

    switch (type) {
        case "png":
            output = new PNG(base64);
            break;
        case "jpeg": case "jpg":
            output = new JPEG(base64);
            break;
        case "qoi":
            output = new QOI(base64);
            break;
        case "bmp":
            output = new BMP(base64);
            break;
    }
    
    return output;
};
