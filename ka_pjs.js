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
  pjsEnv.canvas.id = "PJS_canvas";
  pjsEnv.codeElement.parentNode.replaceChild(pjsEnv.canvas, pjsEnv.codeElement);
  
  // all the code
  pjsEnv.PJS_start = 
  "var canvas = document.getElementById('PJS_canvas');\n" +
  "var processing = new Processing(canvas, function(pjsInst) {\n" +
  "  pjsInst.size(" + pjsEnv.codeElement.dataset.width + ", " + pjsEnv.codeElement.dataset.height + ");\n" +
  "  pjsInst.background(0xFFF);\n" +
  "  var mouseIsPressed = false;\n" +
  "  pjsInst.mousePressed = function() {\n" +
  "    mouseIsPressed = true;\n" +
  "  };\n" +
  "  pjsInst.mouseReleased = function() {\n" +
  "    mouseIsPressed = false;\n" +
  "  };\n" +
  "  var keyIsPressed = false;\n"+
  "  pjsInst.keyPressed = function() {\n" +
  "    keyIsPressed = true;\n" +
  "  };\n" +
  "  pjsInst.keyReleased = function() {\n" +
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
  "    pjsInst.externals.sketch.imageCache.add(url);\n" +
  "    return pjsInst.loadImage(url);\n" +
  "  }\n" +
  "  pjsEnv.canvas.onmousemove = function() {\n" +
  "    pjsInst.mouseY -= document.documentElement.scrollTop;\n" + 
  "  };" +
  "  pjsInst.angleMode = 'degrees';\n" +
  "  with(pjsInst) {\n";
  
  pjsEnv.PJS_end = 
  "  }\n" +
  "  if (typeof draw !== 'undefined') {\n" +
  "    pjsInst.draw = draw;\n" +
  "  }\n" +
  "});";
  
  // create the script to run the code
  pjsEnv.run = document.createElement("script");
  pjsEnv.run.innerHTML = pjsEnv.PJS_start + pjsEnv.codeElement.innerHTML.replace(/this(?=(?:[^"]*"[^"]*")*[^"]*$)/g, "pjsInst") + pjsEnv.PJS_end;
  
  // import KA Processing.js if its not already imported
  if (!document.getElementById("ka_pjs_source")) {
    pjsEnv.lib = document.createElement("script");
    pjsEnv.lib.id = "ka_pjs_source";
    pjsEnv.lib.src = "https://cdn.jsdelivr.net/gh/Khan/processing-js@master/processing.js";
    document.body.appendChild(pjsEnv.lib);
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
