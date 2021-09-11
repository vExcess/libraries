var PJS_run_env = {};

PJS_run_env.codeElement = document.getElementById("PJS_code");

if (PJS_run_env.codeElement) {
  // default the canvas width
  if (!PJS_run_env.codeElement.dataset.width) {
    PJS_run_env.codeElement.dataset.width = 400;
  }
  // default the canvas height
  if (!PJS_run_env.codeElement.dataset.height) {
    PJS_run_env.codeElement.dataset.height = 400;
  }
  
  // create canvas
  PJS_run_env.canvas = document.createElement("canvas");
  PJS_run_env.canvas.id = "PJS_canvas";
  document.body.appendChild(PJS_run_env.canvas);
  
  // all the code
  PJS_run_env.PJS_start = 
  "var canvas = document.getElementById('PJS_canvas');\n" +
  "var processing = new Processing(canvas, function(PJS_Inst) {\n" +
  "  PJS_Inst.size(" + PJS_run_env.codeElement.dataset.width + ", " + PJS_run_env.codeElement.dataset.height + ");\n" +
  "  PJS_Inst.background(0xFFF);\n" +
  "  var mouseIsPressed = false;\n" +
  "  PJS_Inst.mousePressed = function() {\n" +
  "    mouseIsPressed = true;\n" +
  "  };\n" +
  "  PJS_Inst.mouseReleased = function() {\n" +
  "    mouseIsPressed = false;\n" +
  "  };\n" +
  "  var keyIsPressed = false;\n"+
  "  PJS_Inst.keyPressed = function() {\n" +
  "    keyIsPressed = true;\n" +
  "  };\n" +
  "  PJS_Inst.keyReleased = function() {\n" +
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
  "    PJS_Inst.externals.sketch.imageCache.add(url);\n" +
  "    return PJS_Inst.loadImage(url);\n" +
  "  }\n" +
  "  PJS_Inst.angleMode = 'degrees';\n" +
  "  with(PJS_Inst) {\n";
  
  PJS_run_env.PJS_end = 
  "  }\n" +
  "  if (typeof draw !== 'undefined') {\n" +
  "    PJS_Inst.draw = draw;\n" +
  "  }\n" +
  "});";
  
  // create the script to run the code
  PJS_run_env.run = document.createElement("script");
  PJS_run_env.run.innerHTML = PJS_run_env.PJS_start + PJS_run_env.codeElement.innerHTML + PJS_run_env.PJS_end;
  
  // import Processing.js
  PJS_run_env.lib = document.createElement("script");
  PJS_run_env.lib.src = "https://cdn.jsdelivr.net/gh/Khan/processing-js@master/processing.js";
  document.body.appendChild(PJS_run_env.lib);
  
  // once Processing.js is initialized, run the code
  PJS_run_env.loadLib = setInterval(function(){
    if (typeof Processing !== "undefined") {
      document.body.appendChild(PJS_run_env.run);
      clearInterval(PJS_run_env.loadLib);
    } else {
      console.log("Awaiting PJS Initialization");
    }
  }, 20);

// post an error if there is not code
} else {
  console.log("ERROR: PJS_code not found");
}
