class HuffEnNode {
    freq;
    val;
    left;
    right;
    parent;
    constructor(freq, val, left, right, parent) {
        this.freq = freq;
        this.val = val;
        this.left = left;
        this.right = right;
        this.parent = parent;
    }
    getBits() {
        const parent = this.parent;
        if (parent === null)
            return "";
        if (parent.left === this)
            return parent.getBits() + "0";
        if (parent.right === this)
            return parent.getBits() + "1";
    }
}

class HuffDeNode {
    val;
    left;
    right;
    constructor(val, left, right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}

function generateHuffTreeAndTable(freq) {
    let chNodes = {};

    let list = [];
    for (const ch in freq) {
        chNodes[ch] = new HuffEnNode(freq[ch], ch, null, null, null);
        list.push(chNodes[ch]);
    }

    while (list.length > 1) {
        list = list.sort((a, b) => b.freq - a.freq);
        let last = list[list.length - 1];
        let prevLast = list[list.length - 2];
        let newNode = new HuffEnNode(last.freq + prevLast.freq, null, prevLast, last, null);
        last.parent = prevLast.parent = newNode;
        list[list.length - 2] = newNode;
        list.splice(list.length-1, 1);
    }

    let root = list[0];

    let chBin = {};
    for (const ch in freq) {
        const node = chNodes[ch];
        const bits = node.getBits();
        chBin[ch] = bits;
    }

    return {
        root: root,
        table: chBin
    }
}

function huffEncode(buff, huffTable) {
    let msgBits = "";
    for (let i = 0; i < buff.length; i++) {
        msgBits += huffTable[buff[i]];
    }
    return msgBits;
}

function huffDecode(bits, huffTable) {
    let decode = "";
    let i = 1;
    while (bits.length > 0) {
        var slc = bits.slice(0, i);
        for (const bin in huffTable) {
            if (bin === slc) {
                decode += huffTable[bin];
                bits = bits.slice(i);
                i = 0;
                break;
            }
        }
        i++;
    }
    return decode;
}

function huffEncodeTree(node) {
    if (node.left === null) {
        return "1" + node.val.charCodeAt(0).toString(2).padStart(8, "0");
    } else {
        return "0" + huffEncodeTree(node.left) + huffEncodeTree(node.right);
    }
}

function huffDecodeTree(bits, ptr) {
    if (bits[ptr.p] === "1") {
        ptr.p += 1 + 8;
        return new HuffDeNode(String.fromCharCode(parseInt(bits.slice(ptr.p-8, ptr.p), 2)), null, null);
    } else if (ptr.p < bits.length) {
        ptr.p += 1;
        let left = huffDecodeTree(bits, ptr);
        let right = huffDecodeTree(bits, ptr);
        return new HuffDeNode(null, left, right);
    }
}
