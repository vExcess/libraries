/*

  Library for compressing and decompressing JavaScript code using Lempel-Ziv compression in order to get extremely small source code files.
  Uses Terser.js to minify code before compression.

  This library is able to compress JQuery down to 23% of it's original size!
  
  Usage:
      // using callback
      LZJS.onReady(() => {
          LZJS.compress(code, (compressedCode, minifiedCode) => {
              console.log(compressedCode, minifiedCode);
          });
      });
      
      // using await
      LZJS.onReady(async function () {
          let compressedCode = LZJS.compress(code);
          console.log(compressedCode);
      });

*/

var LZJS = {
    dependancies: [
        "https://cdn.jsdelivr.net/npm/source-map@0.7.3/dist/source-map.js",
        "https://cdn.jsdelivr.net/npm/terser/dist/bundle.min.js"
    ],
    ready: 0,
    LZJS: function (txt) {
        var keywords = "abstract arguments boolean break byte case catch char const continue debugger default delete do double else eval false final finally float for function goto if implements in instanceof int interface let long native new null package private protected public return short static switch synchronized this throw throws transient true try typeof var void volatile while with yield class enum export extends import super".split(" ").sort((a, b) => b.length - a.length);

        var usableChars = " !#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿĀāĂăĄąĆćĈĉĊċČčĎďĐđĒēĔĕĖėĘęĚěĜĝĞğĠġĢģĤĥĦħĨĩĪīĬĭĮįİıĲĳĴĵĶķĸĹĺĻļĽľĿŀŁłŃńŅņŇňŉŊŋŌōŎŏŐőŒœŔŕŖŗŘřŚśŜŝŞşŠšŢţŤťŦŧŨũŪūŬŭŮůŰűŲųŴŵŶŷŸŹźŻżŽžſƀƁƂƃƄ";

        var reservedChars = usableChars.slice(usableChars.length - keywords.length, usableChars.length);

        usableChars = usableChars.slice(0, usableChars.length - reservedChars.length);

        for (var i = 0; i < keywords.length; i++) {
            txt = txt.replaceAll(keywords[i], reservedChars.charAt(i));
        }

        // set the size of the search buffer
        var searchBuffSz = 256;

        // set the size of the look ahead buffer
        var lookAheadSz = 256;

        // create the sliding window
        var slidingWindow = new Array(searchBuffSz + lookAheadSz).fill("");

        // the amount of characters we shifted over
        var shiftAmt = 0;

        // the compressed output
        var newTxt = "";

        // load the start of the input into the look ahead buffer
        for (var i = 0; i < lookAheadSz; i++) {
            slidingWindow[searchBuffSz + i] = txt[i];
        }

        // the first character in the look ahread buffer
        var currChar = slidingWindow[searchBuffSz];

        // checks if a character is in the search buffer and if so returns it's index otherwise returns false
        function checkSearchBuff (c) {
            for (var i = searchBuffSz - 1; i >= 0; i--) {
                if (slidingWindow[i] === c) {
                    return i;
                }
            }
            return false;
        }

        // shifts the characters in the sliding window over; loading the next characters into it
        function shiftBuff (times) {
            for (var repeat = times || 1; repeat--;) {
                for (var i = 0; i < slidingWindow.length - 1; i++) {
                    slidingWindow[i] = slidingWindow[i + 1];
                }
                slidingWindow[slidingWindow.length - 1] = txt[shiftAmt + 4];
                shiftAmt++;
                currChar = slidingWindow[searchBuffSz];
            }
        }

        // runs 1 step of the algorithm
        function step () {
            var buffIdx = checkSearchBuff(currChar);
            
            if (shiftAmt === txt.length) {
                println("Compression Complete");
                return true;
            }
            
            if (buffIdx === false) {
                newTxt += currChar;
                shiftBuff();
            } else {
                var len = 0;
                var i = buffIdx;
                while (slidingWindow[i] === slidingWindow[searchBuffSz + len]) {
                    i++;
                    len++;
                }
                
                if (len > 3) {
                    newTxt += "¡" + usableChars.charAt((searchBuffSz - buffIdx)) + usableChars.charAt(len);
                    shiftBuff(len);
                } else {
                    newTxt += currChar;
                    shiftBuff();
                }
            }
        }

        while (shiftAmt < txt.length) {
            step();
        }

        return newTxt;
    },
    compress: async function (code, callback) {
        var minified = await Terser.minify(code);
        var LZified = LZJS.LZJS(minified.code);
        
        if (callback) {
            callback(LZified, minified.code);
        }

        return LZified;
    },
    onReady: function (fxn) {
        if (LZJS.ready > 1) {
            fxn();
        } else {
            setTimeout(function () {
                LZJS.onReady(fxn);
            }, 32);
        }        
    }
};

for (var i = 0; i < LZJS.dependancies.length; i++) {
    let el = document.createElement("script");
    el.src = LZJS.dependancies[i];
    el.onload = function () {
        LZJS.ready++;
    };
    document.head.appendChild(el);
}
