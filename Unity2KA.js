/*

    Unity2KA - By VExcess

    Create a directory with the following files:
        build.framework.js
        build.wasm
        loader.js
        webgl.data
    These files are the output of your Unity build process. Unity may export them
    as .unityweb files. Rename them to .gz and decompress them.

    Next add Unity2KA.js (this file) to the directory.

    Run `node Unity2KA.js` to export the Unity project to a KA compatible HTML file.

    Copy/Paste the index.html file from the output directory to a KA program.
    The data and wasm files will be too big to include directly in the KA program.
    So the exporter creates a data.js and wasm.js files in the output directory.
    These two files need to be uploaded to Github and then imported into KA
    using jsdelivr (https://www.jsdelivr.com/github). Change the paths in the 
    SCRIPTS object (line 242) to your jsdelivr paths. jsdelivr limits files
    to 20 MB, so if the data.js or wasm.js files are too large then they get
    chunked into multiple files.
*/

const zlib = require('zlib');
const fs = require("fs");

console.log("Patching Loader...");
var loaderCode = fs.readFileSync("loader.js").toString();
var a = loaderCode.indexOf('method: "GET",');
if (a === -1) {
    a = loaderCode.indexOf('method:"GET",');
}
var b = loaderCode.slice(a).indexOf("}).then(function(");
var c = loaderCode.slice(a + b).indexOf("}).catch(function(");
loaderCode = loaderCode.slice(0, a + b) 
    + "}).then(function(vexcess_a){return vexcess_a.parsedBody;" 
    + loaderCode.slice(a + b + c);

var pattern = /([a-zA-Z_$][\w$]*)\.companyName\s*&&\s*\1\.productName\s*\?\s*\1\.cachedFetch\s*:\s*\1\.fetchWithProgress/;
var a = pattern.exec(loaderCode).index;
var b = loaderCode.slice(a).indexOf(";") + 1;
loaderCode = loaderCode.slice(0, a + b) 
    + ([
        'var url = arguments[0];',
        'if(url.includes("loader"))return Promise.resolve(assets.loaderCode);',
        'if(url.includes("data"))return Promise.resolve(assets.dataBinary);',
        'if(url.includes("framework"))return Promise.resolve(assets.frameworkCode);',
        'if(url.includes("wasm"))return Promise.resolve(assets.wasmBinary);',
    ].join(""))
    + loaderCode.slice(a + b);

var a = loaderCode.indexOf('("frameworkUrl").then(function(');
var b = loaderCode.slice(a).indexOf("{") + 1;
loaderCode = loaderCode.slice(0, a + b) 
    + ([
        'var vexcess_o=document.createElement("script");',
        'vexcess_o.textContent=arguments[0];',
        'document.body.appendChild(vexcess_o);',
        'if("undefined"==typeof unityFramework||!unityFramework)throw "vexcess: unityFramework not found";',
        'var vexcess_o2=unityFramework;',
        'unityFramework=null; ',
        'return vexcess_o2;',
    ].join(""))
    + loaderCode.slice(a + b);

console.log("Patching Unity Framework...");
var frameworkCode = fs.readFileSync("build.framework.js").toString();
var a = frameworkCode.indexOf("function getBinary(file)");
var b = frameworkCode.slice(a).indexOf("{") + 1;
frameworkCode = frameworkCode.slice(0, a + b)
    + ([
        'if(file.includes("loader"))return assets.loaderCode;',
        'if(file.includes("data"))return assets.dataBinary;',
        'if(file.includes("framework"))return assets.frameworkCode;',
        'if(file.includes("wasm"))return assets.wasmBinary;',
    ].join(""))
    + frameworkCode.slice(a + b);

const dataBuffer = fs.readFileSync("webgl.data");
const wasmBuffer = fs.readFileSync("build.wasm");

console.log("Compressing Assets...");
const compressedLoaderCode = zlib.gzipSync(loaderCode, { level: 9 });
const compressedFrameworkCode = zlib.gzipSync(frameworkCode, { level: 9 });
const compressedData = zlib.gzipSync(dataBuffer, { level: 9 });
const compressedWasm = zlib.gzipSync(wasmBuffer, { level: 9 });

console.log("Encoding Output...");
let base64LoaderCode = compressedLoaderCode.toString('base64');
let base64Data = compressedData.toString('base64');
let base64FrameworkCode = compressedFrameworkCode.toString('base64');
let base64Wasm = compressedWasm.toString('base64');

function stringit(compressed, decompressed, scripts) {
return `<!DOCTYPE html>
<html>
<!--
    Exported to KA using VExcess Unity2KA exporter (https://github.com/vExcess/libraries/blob/main/Unity2KA.js)
-->
<head>
    <meta charset="utf-8">
    <title>Unity Export</title>
    <style>
        body {
            font-family: sans-serif;
            margin: 0;
            overflow: hidden;
        }
    </style>
</head> 
<body>
    <h1 id="load-notif">Loading Project Assets (${compressed} KiB)...<br>Decompressing Project Assets (${decompressed} KiB)...<br>(This may take a while)</h1>

    <div id="unity-container" class="unity-desktop">
        <canvas id="unity-canvas"></canvas>
        <div id="unity-loading-bar">
            <div id="unity-logo"></div>
            <div id="unity-progress-bar-empty">
                <div id="unity-progress-bar-full"></div>
            </div>
        </div>
        <div id="unity-warning"> </div>
    </div>

    <!-- Import Pako.js to ungzip the files -->
    <script src="https://cdn.jsdelivr.net/gh/nodeca/pako@master/dist/pako.min.js"></script>
    
    <script type>
/*
Copyright (c) 2011, Daniel Guerrero
All rights reserved.
Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL DANIEL GUERRERO BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Uses the new array typed in javascript to binary base64 encode/decode
 * at the moment just decodes a binary base64 encoded
 * into either an ArrayBuffer (decodeArrayBuffer)
 * or into an Uint8Array (decode)
 * 
 * References:
 * https://developer.mozilla.org/en/JavaScript_typed_arrays/ArrayBuffer
 * https://developer.mozilla.org/en/JavaScript_typed_arrays/Uint8Array
 */

var Base64 = {
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

	Uint8ToB64: async function(arr) {
		const b64URL = await new Promise(resolve => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result.slice(reader.result.indexOf(",") + 1));
			reader.readAsDataURL(new Blob([arr]));
		});
		return b64URL;
	},
	
	/* will return a  Uint8Array type */
	decodeArrayBuffer: function(input) {
		var bytes = (input.length/4) * 3;
		var ab = new ArrayBuffer(bytes);
		this.decode(input, ab);
		
		return ab;
	},

	removePaddingChars: function(input){
		var lkey = this._keyStr.indexOf(input.charAt(input.length - 1));
		if(lkey == 64){
			return input.substring(0,input.length - 1);
		}
		return input;
	},

	decode: function (input, arrayBuffer) {
		//get last chars to see if are valid
		input = this.removePaddingChars(input);
		input = this.removePaddingChars(input);

		var bytes = parseInt((input.length / 4) * 3, 10);
		
		var uarray;
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;
		var j = 0;
		
		if (arrayBuffer)
			uarray = new Uint8Array(arrayBuffer);
		else
			uarray = new Uint8Array(bytes);
		
		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
		
		for (i=0; i<bytes; i+=3) {	
			//get the 3 octects in 4 ascii chars
			enc1 = this._keyStr.indexOf(input.charAt(j++));
			enc2 = this._keyStr.indexOf(input.charAt(j++));
			enc3 = this._keyStr.indexOf(input.charAt(j++));
			enc4 = this._keyStr.indexOf(input.charAt(j++));
	
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;
	
			uarray[i] = chr1;			
			if (enc3 != 64) uarray[i+1] = chr2;
			if (enc4 != 64) uarray[i+2] = chr3;
		}
	
		return uarray;	
	}
}
    </script>
    
    <!-- This ungzips and sets up everything -->
    <script type>
window.assets = {
    dataBinary: null,
    loaderCode: null,
    frameworkCode: null,
    wasmBinary: null
};
var netRequest = fetch;
window.fetch = function() {
    var url = arguments[0];
    console.log("FETCH", arguments);
    if (url.includes("loader")) {
        return Promise.resolve({
            text() {
                return assets.loaderCode;
            }
        });
    }
    if (url.includes("data")) {
        return Promise.resolve({
            arrayBuffer() {
                return assets.dataBinary;
            }
        });
    }
    if (url.includes("framework")) {
        return Promise.resolve({
            text() {
                return assets.frameworkCode;
            }
        });
    }
    if (url.includes("wasm")) {
        return Promise.resolve({
            arrayBuffer() {
                return assets.wasmBinary;
            }
        });
    }
};

async function runProject() {
    var temp;

    // temp = await netRequest("./loader.js");
    // assets.loaderCode = await temp.text();
    assets.loaderCode = pako.ungzip(Base64.decode("${base64LoaderCode}"), {to:"string"});

    // temp = await netRequest("./webgl.data");
    // temp = await temp.arrayBuffer();
    // assets.dataBinary = new Uint8Array(temp);
    assets.dataBinary = pako.ungzip(Base64.decode(unity_data));

    // temp = await netRequest("./build.framework.js");
    // assets.frameworkCode = await temp.text();
    assets.frameworkCode = pako.ungzip(Base64.decode("${base64FrameworkCode}"), {to:"string"});

    // temp = await netRequest("./build.wasm");
    // temp = await temp.arrayBuffer();
    // assets.wasmBinary = new Uint8Array(temp);
    assets.wasmBinary = pako.ungzip(Base64.decode(unity_wasm));

    // --  --  --  --  --  --  --  --  --  --  --  --  --  --  

    // store the components Unity needs to access
    window.globalConfig = {
        // companyName: "Unity",
        frameworkUrl: "framework.js",
        dataUrl: "data.wasm",
        codeUrl: "wasm.wasm"
    };
    window.container = document.querySelector("#unity-container");
    window.canvas = document.querySelector("#unity-canvas");
    window.loadingBar = document.querySelector("#unity-loading-bar");
    window.progressBarFull = document.querySelector("#unity-progress-bar-full");
        
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        alert("Unity WebGL builds aren't supported on mobile"); // big sad
    }

    // make the canvas whatever size you want, Unity automatically adjusts
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";

    console.log("Starting Unity...");
    eval(assets.loaderCode + \`
        createUnityInstance(canvas, window.globalConfig, (e => {
            progressBarFull.style.width = 100 * e + "%"
        })).then((e => {
            loadingBar.style.display = "none"
        })).catch((e => {
            throw e;
            alert(e);
        }));
    \`);
}
    </script>

    <script>
        /* REPLACE WITH JSDELIVR LINKS */
        var SCRIPTS = ${JSON.stringify(scripts)};

        window.unity_data = null;
        window.unity_wasm = null;
        
        var scriptsLoaded = 0;
        var loadedFlags = new Array(SCRIPTS.length).fill(0);
        function loadScript(idx) {
            var el = document.createElement("script");
            el.src = SCRIPTS[idx];
            el.async = true;
            el.onload = function() {
                console.log(SCRIPTS[idx], "loaded");
                loadedFlags[idx] = 2;
            };
            document.body.append(el);
        }

        // lets light this candle - Bob Lyon
        var initInterval;
        initInterval = setInterval(function() {
            for (var i = 0; i < loadedFlags.length; i++) {
                if (loadedFlags[i] === 0) {
                    loadedFlags[i] = 1;
                    loadScript(i);
                }
                if (loadedFlags[i] === 1) {
                    break;
                }
                if (loadedFlags[i] === 2) {
                    loadedFlags[i] = 3;
                    document.getElementById("load-notif").innerHTML += "<br>" + (i+1) + "/" + SCRIPTS.length + " complete";
                }
            }

            for (var i = 0; i < loadedFlags.length; i++) {
                if (loadedFlags[i] !== 3) {
                    return;
                }
            }

            if (window.unity_data === null) {
                console.error("The imported scripts did not set unity_data");
            }
            if (window.unity_wasm === null) {
                console.error("The imported scripts did not set unity_wasm");
            }

            document.getElementById("load-notif").remove();
            clearInterval(initInterval);
            runProject();
        }, 1000 / 100);
    </script>
</body>
</html>

`;
}

// https://stackoverflow.com/a/2901298/19194333
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

if (!fs.existsSync("./output")) {
    fs.mkdirSync("./output");
}

var scripts = [];

// write data chunks
var chunkId = 0;
while (base64Data.length > 0) {
    var end = Math.min(base64Data.length, 1000 * 1000 * 20);
    scripts.push(`./data${chunkId}.js`);
    fs.writeFileSync(`./output/data${chunkId}.js`, `window.unity_data ${chunkId === 0 ? "=" : "+="} "${base64Data.slice(0, end)}"`);
    chunkId++;
    base64Data = base64Data.slice(end);
}

// write wasm chunks
var chunkId = 0;
while (base64Wasm.length > 0) {
    var end = Math.min(base64Wasm.length, 1000 * 1000 * 20);
    scripts.push(`./wasm${chunkId}.js`);
    fs.writeFileSync(`./output/wasm${chunkId}.js`, `window.unity_wasm ${chunkId === 0 ? "=" : "+="} "${base64Wasm.slice(0, end)}"`);
    chunkId++;
    base64Wasm = base64Wasm.slice(end);
}

// write html
let html = stringit(
    numberWithCommas(Math.round((8000 + base64LoaderCode.length + base64Data.length + base64FrameworkCode.length + base64Wasm.length) / 1024)),
    numberWithCommas(Math.round((8000 + (loaderCode.length + dataBuffer.length + frameworkCode.length + wasmBuffer.length)*1.33) / 1024)),
    scripts
);
fs.writeFileSync("./output/index.html", html);

console.log("Project written to the directory ./output");
console.log("See comments at top of Unity2KA.js for instructions.");
