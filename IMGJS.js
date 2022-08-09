var IMGJS = {
    import: function (src, callback) {
        fetch(src).then(async function (res) {
            let mime = res.headers.get("content-type");
            let arrBuff = await res.arrayBuffer();
            return [mime, arrBuff];
        }).then(function (data) {
            function arrBuffToB64 (arrBuff) {
                return btoa(Array.from(new Uint8Array(arrBuff)).map(c => String.fromCharCode(c)).join(''));
            }

            let img = new Image();
            img.src = "data:" + data[0] + ";base64," + arrBuffToB64(data[1]);
            img.onload = function () {
                let canvas = document.createElement("canvas");
                let ctx = canvas.getContext("2d");

                canvas.width = img.width;
                canvas.height = img.height;

                ctx.drawImage(img, 0, 0);

                let pixels = ctx.getImageData(0, 0, img.width, img.height).data;
                let txtBin = [];
                for (var i = 0, len = pixels.length; i < len; i += 4) {
                    txtBin.push(Math.round((pixels[i] / 255 + pixels[i + 1] / 255 + pixels[i + 2] / 255) / 3));
                }

                let code = txtBin.map(n => n.toString()).join("").match(/.{1,8}/g).map(s => String.fromCharCode(parseInt(s, 2))).join("").replaceAll(String.fromCharCode(0), "");

                let s = document.createElement("script");
                s.innerHTML = code;
                document.body.appendChild(s);

                callback(s, img);
            };
        });
    }
};
