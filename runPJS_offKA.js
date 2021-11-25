// create environment object
var pjsEnv = {};

// get the PJS code
pjsEnv.codeElement = document.getElementById("PJS_code");

if (pjsEnv.codeElement) {
  // default the canvas width
  if (!pjsEnv.codeElement.dataset.width) {
    pjsEnv.codeElement.dataset.width = 400;
  }
  // default the canvas height
  if (!pjsEnv.codeElement.dataset.height) {
    pjsEnv.codeElement.dataset.height = 400;
  }
  
  // create canvas
  pjsEnv.canvas = document.createElement("canvas");
  pjsEnv.canvas.id = "pjs-canvas";
  pjsEnv.codeElement.parentNode.replaceChild(pjsEnv.canvas, pjsEnv.codeElement);
  
  // all the code
  pjsEnv.PJS_start = 
  "new Processing(pjsEnv.canvas, function(processingInstance) {\n" +
  "  processingInstance.size(" + pjsEnv.codeElement.dataset.width + ", " + pjsEnv.codeElement.dataset.height + ");\n" +
  "  processingInstance.background(0xFFF);\n" +
  "  var mouseIsPressed = false;\n" +
  "  processingInstance.mousePressed = function() {\n" +
  "    mouseIsPressed = true;\n" +
  "  };\n" +
  "  processingInstance.mouseReleased = function() {\n" +
  "    mouseIsPressed = false;\n" +
  "  };\n" +
  "  var keyIsPressed = false;\n"+
  "  processingInstance.keyPressed = function() {\n" +
  "    keyIsPressed = true;\n" +
  "  };\n" +
  "  processingInstance.keyReleased = function() {\n" +
  "    keyIsPressed = false;\n" +
  "  };\n" +
  "  function getSound(s) {\n" +
  "    var url = 'sounds/' + s + '.mp3';\n" +
  "    return new Audio(url);\n" +
  "  }\n" +
  "  function playSound(s) {\n" +
  "    s.play();\n" +
  "  }\n" +
  "  function getImage(s) {\n" +
  "    var url = 'https://www.kasandbox.org/programming-images/' + s + '.png';\n" +
  "    processingInstance.externals.sketch.imageCache.add(url);\n" +
  "    return processingInstance.loadImage(url);\n" +
  "  }\n" +
  "  processingInstance.angleMode = 'degrees';\n" +
  "  with(processingInstance) {\n";
  
  pjsEnv.PJS_end = 
  "  \n" +
  "  }\n" +
  "  if (typeof draw !== 'undefined') {\n" +
  "    processingInstance.draw = draw;\n" +
  "  }\n" +
  "});";
  
  pjsEnv.replaceAll = function(string, oldTxt, newTxt){
    while (string.includes(oldTxt)) {
      string = string.replace(oldTxt, newTxt);
    }
    return string;
  };
  
  // create the script to run the code
  pjsEnv.run = document.createElement("script");
  pjsEnv.run.id = "pjs-runScript";
  pjsEnv.code = pjsEnv.replaceAll(pjsEnv.codeElement.innerHTML, "this.__frameRate", "__frameRate");
  pjsEnv.code = pjsEnv.replaceAll(pjsEnv.code, "this.cursor", "cursor");
  pjsEnv.code = pjsEnv.replaceAll(pjsEnv.code, 'this[["KAInfiniteLoopSetTimeout"]]', "return ");
  pjsEnv.code = pjsEnv.replaceAll(pjsEnv.code, 'this[["KAInfiniteLoopSetTimeout"][0]]', "return ");
  pjsEnv.code = pjsEnv.replaceAll(pjsEnv.code, 'this[["KAInfiniteLoopCount"]] = ', "return ");
  
  pjsEnv.code = pjsEnv.replaceAll(pjsEnv.code, "this[['KAInfiniteLoopSetTimeout']]", "return ");
  pjsEnv.code = pjsEnv.replaceAll(pjsEnv.code, "this[['KAInfiniteLoopSetTimeout'][0]]", "return ");
  pjsEnv.code = pjsEnv.replaceAll(pjsEnv.code, "this[['KAInfiniteLoopCount']] = ", "return ");

  pjsEnv.code = pjsEnv.replaceAll(pjsEnv.code, '.LoopProtector.prototype.leave = function() {};', "");
  pjsEnv.run.innerHTML = pjsEnv.PJS_start + pjsEnv.code + pjsEnv.PJS_end;
  
  // import KA Processing.js if its not already imported
  if (!document.getElementById("ka_pjs_source")) {
    pjsEnv.lib = document.createElement("script");
    pjsEnv.lib.id = "ka_pjs_source";
    pjsEnv.lib.src = "https://cdn.jsdelivr.net/gh/Khan/processing-js@master/processing.js";
    document.head.appendChild(pjsEnv.lib);
  }
  
  // once Processing.js is initialized, run the code
  pjsEnv.loadLib = setInterval(function(){
    if (typeof Processing !== "undefined") {
      document.body.appendChild(pjsEnv.run);
      console.log("PJS Initialized");
      clearInterval(pjsEnv.loadLib);
    } else {
      console.log("Awaiting PJS Initialization. . .");
    }
  }, 20);

// post an error if there is not code
} else {
  console.log("ERROR: PJS_code not found");
}
